import { createContext, useContext } from "react";
import { ExamContextType } from "./types";

// 创建上下文
const ExamContext = createContext<ExamContextType | undefined>(undefined);

// 使用上下文的Hook
export const useExam = () => {
  const context = useContext(ExamContext);
  
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  
  return context;
};

export default ExamContext; 