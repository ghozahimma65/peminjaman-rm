export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Memuat data..." }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <div className="spinner large"></div>
      <p>{message}</p>
    </div>
  );
}
