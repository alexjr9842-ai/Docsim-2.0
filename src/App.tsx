import React, { useState } from "react";
import { ActiveTab } from "./types";
import { Navbar } from "./components/Navbar";
import { RealCardStudio } from "./components/RealCardStudio";
import { TemplateDesigner } from "./components/TemplateDesigner";
import { PsdEditor } from "./components/PsdEditor";
import { DocumentSimulator } from "./components/DocumentSimulator";
import { AugmentationEditor } from "./components/AugmentationEditor";
import { CodeEditor } from "./components/CodeEditor";
import { GitManager } from "./components/GitManager";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("real-card");
  const [currentTemplatePath, setCurrentTemplatePath] = useState<string>(
    "templates/Aadhaar/Front/template.json"
  );
  const [currentPsdPath, setCurrentPsdPath] = useState<string>(
    "templates/Aadhaar/Front/template.psd"
  );
  const [currentEditorFile, setCurrentEditorFile] = useState<string>("README.md");

  const handleDownloadZip = () => {
    window.location.href = "/api/export/zip";
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Universal Studio Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
      />

      {/* Primary Workspace Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === "real-card" && (
          <RealCardStudio
            initialPsdPath={currentPsdPath}
            onOpenPsdStudio={(psdPath) => {
              setCurrentPsdPath(psdPath);
              setActiveTab("psd");
            }}
            onOpenTemplateDesigner={(templatePath) => {
              setCurrentTemplatePath(templatePath);
              setActiveTab("template-designer");
            }}
          />
        )}

        {activeTab === "template-designer" && (
          <TemplateDesigner
            initialPath={currentTemplatePath}
            onSaved={(path) => {
              setCurrentTemplatePath(path);
            }}
            onOpenPsdStudio={() => setActiveTab("psd")}
            onOpenRealCardStudio={() => setActiveTab("real-card")}
          />
        )}

        {activeTab === "psd" && (
          <PsdEditor
            initialPsdPath={currentPsdPath}
            onConvertToTemplate={(path) => {
              setCurrentTemplatePath(path);
              setActiveTab("template-designer");
            }}
            onOpenRealCardStudio={(path) => {
              setCurrentPsdPath(path);
              setActiveTab("real-card");
            }}
          />
        )}

        {activeTab === "simulator" && (
          <DocumentSimulator initialPath={currentTemplatePath} />
        )}

        {activeTab === "augmentation" && <AugmentationEditor />}

        {activeTab === "editor" && (
          <CodeEditor
            initialFile={currentEditorFile}
            onFileSaved={(path) => {
              setCurrentEditorFile(path);
            }}
            onOpenPsd={(path) => {
              setCurrentPsdPath(path);
              setActiveTab("psd");
            }}
          />
        )}

        {activeTab === "git" && <GitManager />}
      </main>
    </div>
  );
}
