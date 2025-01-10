function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  );
}

export default FullScreenLoader; 