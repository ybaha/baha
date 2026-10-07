type Props = {
  children: React.ReactNode;
};

export default function VaultLayout({ children }: Props) {
  return <div className="flex-1 lg:bg-grid">{children}</div>;
}
