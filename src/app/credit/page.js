'use client';

export default function CreditPage() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
      <div className="bg-gray-900 shadow-lg rounded-lg p-10 w-full max-w-xl text-center text-white">
        <h1 className="text-3xl font-bold mb-6 whitespace-pre-line">
          This Project{'\n'}Create by
        </h1>

        <div className="space-y-4 text-lg font-medium mb-10">
          <div>🔹 Phongphit Thongchuenjit 6609684</div>
          <div>🔹 Name 2</div>
          <div>🔹 Name 3</div>
        </div>

        <div className="text-sm text-gray-400 whitespace-pre-line">
          CSC 350{'\n'}College of Digital Innovation Technology
        </div>
      </div>
    </div>
  );
}