"use client";

import TemplateForm from "../components/TemplateForm";

export default function TemplateDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          TemplateForm Component Demo
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Create Mode
          </h2>
          <TemplateForm
            mode="create"
            onSuccess={(template) => {
              console.log("Created template:", template);
              alert(`Template "${template.name}" created successfully!`);
            }}
            onCancel={() => {
              console.log("Create cancelled");
            }}
          />
        </div>
      </div>
    </div>
  );
}
