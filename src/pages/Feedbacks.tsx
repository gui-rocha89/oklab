import { useState } from "react";
import { Header } from "@/components/Header";
import FeedbackList from "@/components/FeedbackList";

// Task 1: Componente FeedbackList.jsx integrado
export default function Feedbacks() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Feedbacks" 
        subtitle="Central de comentários e avaliações dos projetos"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <FeedbackList />
      </div>
    </div>
  );
}