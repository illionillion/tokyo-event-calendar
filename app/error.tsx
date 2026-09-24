"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  void error;

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-pretty font-medium">イベントを取得できませんでした。</p>
      <p className="mt-2 text-pretty text-sm text-secondary">
        しばらくしてから再度お試しください。
      </p>
      <button
        type="button"
        className="mt-5 h-9 rounded-md bg-primary px-3 text-sm text-white hover:bg-primary-hover"
        onClick={() => reset()}
      >
        再読み込み
      </button>
    </main>
  );
}
