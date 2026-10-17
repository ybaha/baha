from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect
import os, shutil, socket, subprocess, tempfile, time, json, signal, urllib.request, re, sys

sys.stdout.reconfigure(line_buffering=True)
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
OUT = Path(tempfile.mkdtemp(prefix='baha-static-e2e-'))
APP = OUT / 'app'
APP.mkdir()
RESULTS = []
PROCESSES = []
LOGS = []

def interrupted(_signal, _frame):
    raise InterruptedError('Static browser check interrupted or exceeded its deadline')

signal.signal(signal.SIGTERM, interrupted)
signal.signal(signal.SIGINT, interrupted)
signal.signal(signal.SIGALRM, interrupted)
signal.alarm(240)

def port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]

def spawn(args, name, cwd=ROOT, env=None):
    stream = open(OUT / (name + '.log'), 'w')
    LOGS.append(stream)
    proc = subprocess.Popen(args, cwd=cwd, env=env, stdout=stream, stderr=subprocess.STDOUT, start_new_session=True)
    PROCESSES.append(proc)
    return proc

def stop(proc):
    if proc.poll() is not None:
        return
    os.killpg(proc.pid, signal.SIGTERM)
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=5)

def wait_url(url, proc, seconds=20):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            raise RuntimeError('Owned process exited during startup; see logs at ' + str(OUT))
        try:
            urllib.request.build_opener(urllib.request.ProxyHandler({})).open(url, timeout=1).read()
            return
        except Exception:
            time.sleep(.1)
    raise RuntimeError('Owned process readiness timed out: ' + url)

try:
    web_port, api_port = port(), port()
    metadata = OUT / 'fixture.json'
    fixture = spawn(['node', '--import', 'tsx', str(ROOT / 'test/browser/api-fixture.mts'), str(ROOT), str(web_port), str(api_port), str(metadata)], 'api')
    deadline = time.monotonic() + 15
    while not metadata.exists() and time.monotonic() < deadline:
        time.sleep(.05)
    data = json.loads(metadata.read_text())
    wait_url(f'http://127.0.0.1:{api_port}/healthz', fixture)
    print('Local API fixture ready:', OUT)
    for name in ['src', 'public', 'content', 'images', 'types']:
        shutil.copytree(ROOT / name, APP / name, symlinks=True)
    for name in ['package.json', 'package-lock.json', 'next.config.js', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.js']:
        shutil.copy2(ROOT / name, APP / name)
    shutil.copytree(ROOT / 'packages', APP / 'packages', ignore=shutil.ignore_patterns('node_modules', 'dist'))
    (APP / 'server').mkdir()
    shutil.copy2(ROOT / 'server/package.json', APP / 'server/package.json')
    blocked_env = {'DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'API_AUTH_SECRET', 'API_BASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'GITHUB_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'TELEGRAM_BOT_TOKEN'}
    env = {key: value for key, value in os.environ.items() if key not in blocked_env}
    env.update({'NODE_ENV': 'production', 'NEXT_PUBLIC_API_URL': data['apiOrigin'], 'SITE_URL': 'https://ybaha.com', 'NEXT_TELEMETRY_DISABLED': '1', 'NEXT_PUBLIC_DISABLE_AUTH': 'false', 'NEXT_PUBLIC_ENABLE_VISIT_NOTIFICATIONS': 'true'})
    install_env = dict(env)
    install_env.pop('NODE_ENV', None)
    print('Starting fresh frontend install')
    install = spawn(['npm', 'ci', '--include=dev', '--no-audit', '--no-fund'], 'install', APP, install_env)
    try:
        install_code = install.wait(timeout=90)
    except subprocess.TimeoutExpired:
        stop(install)
        raise RuntimeError('Clean scratch npm ci exceeded 90 seconds')
    assert install_code == 0, 'Clean scratch npm ci failed; see install.log'
    assert not (APP / 'test/generated/prisma').exists(), 'Web install unexpectedly generated ORM fixture'
    RESULTS.append({'check': 'fresh frontend install without database/auth env or generated ORM', 'pass': True})
    print('Fresh install passed; starting static build')
    build = spawn(['npm', 'run', 'build:web'], 'build', APP, env)
    try:
        code = build.wait(timeout=80)
    except subprocess.TimeoutExpired:
        stop(build)
        raise RuntimeError('Scratch static build exceeded 80 seconds')
    assert code == 0, 'Scratch static build failed; see build.log'
    print('Static build passed; starting browser checks')
    web = spawn(['node', str(APP / 'node_modules/serve/build/main.js'), str(APP / 'out'), '-l', f'tcp://127.0.0.1:{web_port}', '--no-clipboard'], 'static', APP, env)
    wait_url(data['frontendOrigin'], web)

    with sync_playwright() as pw:
        exe = Path(os.environ.get('BROWSER_EXECUTABLE', pw.chromium.executable_path))
        if not exe.exists():
            raise RuntimeError('No cached Chromium found. Set BROWSER_EXECUTABLE to an existing compatible browser; this test never installs one.')
        browser = pw.chromium.launch(headless=True, executable_path=str(exe))
        requests = []
        page_errors = []
        failed_assets = []
        ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, color_scheme='light', reduced_motion='reduce')
        ctx.add_cookies([data['cookie']])
        ctx.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).hostname in ['127.0.0.1', 'localhost'] else route.abort())
        page = ctx.new_page()
        page.set_default_timeout(10000)
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.on('request', lambda request: requests.append({'url': request.url, 'headers': request.headers, 'method': request.method}))
        page.on('response', lambda response: failed_assets.append(response.url) if response.status >= 400 and urlparse(response.url).port == web_port else None)
        for path in ['/', '/writings', '/vault', '/logs', '/projects', '/tech-stack', '/writings/' + data['slug'], '/vault/first-one']:
            response = page.goto(data['frontendOrigin'] + path, wait_until='networkidle')
            assert response.status == 200, path
            assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), path + ' horizontal overflow'
            page.screenshot(path=str(OUT / ('desktop-' + (path.strip('/').replace('/', '-') or 'home') + '.png')), full_page=True)
            RESULTS.append({'check': 'desktop route', 'path': path, 'status': response.status, 'title': page.title()})
        page.goto(data['frontendOrigin'] + '/writings/' + data['slug'], wait_until='networkidle')
        section = page.locator('#comments-section')
        expect(section.get_by_role('textbox', name='Write a comment')).to_be_visible(timeout=10000)
        expect(section.locator('article')).to_have_count(5)
        section.get_by_role('button', name='Load more', exact=True).click()
        expect(section.locator('article')).to_have_count(10)
        section.get_by_role('textbox', name='Write a comment').fill('Browser migration test')
        with page.expect_response(lambda response: response.url.endswith('/rpc/comments/create') and response.request.method == 'POST') as posting:
            section.get_by_role('button', name='Post comment', exact=True).click()
        posted_response = posting.value
        print('Browser post HTTP status:', posted_response.status)
        assert posted_response.status == 200, posted_response.text()
        created = section.locator('article').filter(has_text='Browser migration test')
        expect(created).to_be_visible()
        assert section.locator('article').count() >= 10, 'Posting collapsed expanded pagination'
        created.get_by_role('button', name='Upvote comment', exact=True).click()
        expect(created.get_by_role('button', name='Upvote comment', exact=True)).to_have_attribute('aria-pressed', 'true')
        RESULTS.append({'check': 'real API authenticated posting, pagination and voting', 'pass': True})

        page.goto(data['frontendOrigin'], wait_until='networkidle')
        page.get_by_role('button', name='Toggle color theme', exact=True).click()
        expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
        page.reload(wait_until='networkidle')
        expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
        page.get_by_role('button', name='Change accent color', exact=True).click()
        accents = page.get_by_role('button', name=re.compile('^Use .* accent$'))
        accents.nth(1).click()
        accent = page.evaluate("localStorage.getItem('baha-accent')")
        assert accent
        page.reload(wait_until='networkidle')
        channels = page.evaluate("['--pr','--pg','--pb'].map(k=>document.documentElement.style.getPropertyValue(k)).join(' ')")
        assert channels == accent, (channels, accent)
        page.keyboard.press('Meta+k')
        search = page.locator('[cmdk-input]').first
        expect(search).to_be_visible()
        search.fill('typescript')
        expect(page.locator('[cmdk-item]').first).to_be_visible()
        page.keyboard.press('Escape')
        page.locator('a[href="/projects"]').first.click()
        page.wait_for_url('**/projects')
        RESULTS.append({'check': 'theme/accent persistence, command search, client navigation', 'pass': True})

        # A separate preview origin receives static assets from the owned fixture,
        # and API responses from the real local service via the testing transport.
        preview = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        preview_requests = []
        def preview_route(route):
            parsed = urlparse(route.request.url)
            if parsed.hostname == 'migration-preview.pages.dev':
                response = preview.request.get(data['frontendOrigin'] + parsed.path + ('?' + parsed.query if parsed.query else ''))
                route.fulfill(response=response)
            elif parsed.hostname in ['127.0.0.1', 'localhost']:
                route.continue_()
            else:
                route.abort()
        preview.route('**/*', preview_route)
        preview_page = preview.new_page()
        preview_page.on('request', lambda request: preview_requests.append(request.url))
        preview_page.goto('https://migration-preview.pages.dev/writings/' + data['slug'], wait_until='networkidle')
        expect(preview_page.locator('#comments-section')).to_contain_text(re.compile('read.only|preview', re.I))
        assert preview_page.get_by_role('button', name='Sign in to comment', exact=True).count() == 0
        assert not any('/auth/' in url or '/views/increment' in url or '/visits/notify' in url or 'ipapi.co' in url for url in preview_requests)
        RESULTS.append({'check': 'preview has no auth, write or location requests', 'pass': True})
        preview.close()

        mobile = browser.new_context(viewport={'width': 390, 'height': 844}, color_scheme='light', reduced_motion='reduce')
        mobile.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).hostname in ['127.0.0.1', 'localhost'] else route.abort())
        mobile_page = mobile.new_page()
        mobile_page.on('pageerror', lambda error: page_errors.append(str(error)))
        for path in ['/', '/projects', '/logs', '/writings/' + data['slug'], '/vault/first-one']:
            response = mobile_page.goto(data['frontendOrigin'] + path, wait_until='networkidle')
            assert response.status == 200
            assert not mobile_page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), path
            mobile_page.screenshot(path=str(OUT / ('mobile-' + (path.strip('/').replace('/', '-') or 'home') + '.png')), full_page=True)
        missing = mobile_page.goto(data['frontendOrigin'] + '/does-not-exist', wait_until='networkidle')
        assert missing.status == 404
        mobile.close()
        RESULTS.append({'check': 'mobile routes, no overflow, missing-route 404', 'pass': True})

        page.goto(data['frontendOrigin'] + '/writings/' + data['slug'], wait_until='networkidle')
        text = page.locator('#comments-section').get_by_role('textbox', name='Write a comment')
        expect(text).to_be_visible()
        text.fill('Keep this draft after failure')
        stop(fixture)
        page.locator('#comments-section').get_by_role('button', name='Post comment', exact=True).click()
        expect(text).to_be_enabled(timeout=20000)
        expect(text).to_have_value('Keep this draft after failure')
        page.reload(wait_until='networkidle')
        expect(page.locator('#comments-section')).to_contain_text(re.compile('failed to load|unavailable|try again', re.I), timeout=20000)
        assert page.locator('#comments-section').get_by_text('Checking sign-in…', exact=True).count() == 0
        assert page.locator('article.content').inner_text().strip()
        page.screenshot(path=str(OUT / 'api-offline.png'), full_page=True)
        RESULTS.append({'check': 'API-offline draft retention, auth error and readable static content', 'pass': True})
        assert not page_errors, page_errors
        assert not failed_assets, failed_assets
        assert not any('next-action' in request['headers'] or '/api/' in urlparse(request['url']).path for request in requests)
        assert not any('ipapi.co' in request['url'] or '/visits/notify' in request['url'] for request in requests), 'Local browser must never send visit notifications'
        RESULTS.append({'check': 'no JS page errors, missing static assets, Next API or Server Action requests', 'pass': True})
        ctx.close()
        browser.close()
except Exception as error:
    RESULTS.append({'check': 'failure', 'error': str(error)})
    print('FAILED:', str(error))
    raise
finally:
    signal.alarm(0)
    for proc in reversed(PROCESSES):
        stop(proc)
    for stream in LOGS:
        stream.close()
    (OUT / 'results.json').write_text(json.dumps(RESULTS, indent=2))
    print('Artifacts:', OUT)
    print(json.dumps(RESULTS, indent=2))
