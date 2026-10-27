export default function Loading() {
  return (
    <div className="min-h-screen bg-paper" role="status" aria-label="Loading">
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px] overflow-hidden bg-rani/15">
        <div className="h-full w-1/3 animate-[loadbar_1s_ease-in-out_infinite] bg-rani" />
      </div>
    </div>
  );
}
