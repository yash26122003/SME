import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Test App - This should be visible
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-lg text-gray-600">
          If you can see this, the basic React setup is working!
        </p>
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <p className="text-blue-800">CSS styling is also working</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;
