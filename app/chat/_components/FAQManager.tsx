"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatCenter, FAQSection, Question } from "../_context/ChatCenterContext";
import { apiClient } from "@/lib/api";
import { useSWRConfig } from "swr";
import { FAQActionModal, ConfirmDeleteModal } from "./FAQModals";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Question Component ---
function SortableQuestion({
  item,
  sectionId,
  onEdit,
  onDelete,
}: {
  item: Question;
  sectionId: string;
  onEdit: (sectionId: string, questionId: string, q: string, a: string) => void;
  onDelete: (sectionId: string, questionId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors relative"
    >
      <div
        className="text-slate-400 mt-1 cursor-grab hover:text-slate-600 shrink-0 outline-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 space-y-2">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 block">السؤال</span>
          <p className="text-sm font-semibold text-slate-800">{item.q}</p>
        </div>
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">الإجابة</span>
          <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-blue-600"
          onClick={() => onEdit(sectionId, item.id, item.q, item.a)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-600"
          onClick={() => onDelete(sectionId, item.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// --- Sortable Section Component ---
function SortableSection({
  section,
  isExpanded,
  onToggleExpand,
  onEditSection,
  onDeleteSection,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: {
  section: FAQSection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditSection: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onAddQuestion: (sectionId: string) => void;
  onEditQuestion: (sectionId: string, questionId: string, q: string, a: string) => void;
  onDeleteQuestion: (sectionId: string, questionId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:border-slate-300 relative"
    >
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-slate-50/50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div
            className="text-slate-400 cursor-grab hover:text-slate-600 outline-none"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800">{section.title}</h3>
          <span className="bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-600 shadow-sm">
            {section.questions.length} أسئلة
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-blue-600 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEditSection(section.id, section.title);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-red-600 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSection(section.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Questions List */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-100 bg-white space-y-3" onClick={(e) => e.stopPropagation()}>
            <SortableContext
              items={section.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {section.questions.map((item) => (
                <SortableQuestion
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  onEdit={onEditQuestion}
                  onDelete={onDeleteQuestion}
                />
              ))}
            </SortableContext>

          <Button
            onClick={() => onAddQuestion(section.id)}
            variant="outline"
            className="w-full mt-2 border-dashed border-2 text-slate-500 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة سؤال جديد
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Main FAQManager Component ---
export default function FAQManager() {
  const { sections, setSections, expandedSection, setExpandedSection } = useChatCenter();
  const { mutate } = useSWRConfig();

  // Modal States
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "section" | "question";
    isEdit: boolean;
    sectionId: string;
    questionId: string;
    defaultValues: { title?: string; q?: string; a?: string };
  }>({
    isOpen: false,
    type: "section",
    isEdit: false,
    sectionId: "",
    questionId: "",
    defaultValues: {},
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // --- Handlers for Sections ---
  const handleAddSectionClick = () => {
    setActionModal({
      isOpen: true,
      type: "section",
      isEdit: false,
      sectionId: "",
      questionId: "",
      defaultValues: {},
    });
  };

  const handleEditSectionClick = (id: string, currentTitle: string) => {
    setActionModal({
      isOpen: true,
      type: "section",
      isEdit: true,
      sectionId: id,
      questionId: "",
      defaultValues: { title: currentTitle },
    });
  };

  const handleDeleteSectionClick = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "حذف القسم",
      description: "هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الأسئلة المرتبطة به أيضاً.",
      onConfirm: async () => {
        try {
          await apiClient(`/v1/admin/chat-center/faqs/sections/${id}`, { method: 'DELETE' });
          setSections((prev) => prev.filter((s) => s.id !== id));
          if (expandedSection === id) setExpandedSection(null);
          mutate('/v1/admin/chat-center/faqs');
        } catch (error) {
          console.error(error);
          alert("حدث خطأ أثناء الحذف");
        }
      },
    });
  };

  // --- Handlers for Questions ---
  const handleAddQuestionClick = (sectionId: string) => {
    setActionModal({
      isOpen: true,
      type: "question",
      isEdit: false,
      sectionId,
      questionId: "",
      defaultValues: {},
    });
  };

  const handleEditQuestionClick = (sectionId: string, questionId: string, currentQ: string, currentA: string) => {
    setActionModal({
      isOpen: true,
      type: "question",
      isEdit: true,
      sectionId,
      questionId,
      defaultValues: { q: currentQ, a: currentA },
    });
  };

  const handleDeleteQuestionClick = (sectionId: string, questionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "حذف السؤال",
      description: "هل أنت متأكد من حذف هذا السؤال نهائياً؟",
      onConfirm: async () => {
        try {
          await apiClient(`/v1/admin/chat-center/faqs/questions/${questionId}`, { method: 'DELETE' });
          setSections((prev) =>
            prev.map((s) => {
              if (s.id === sectionId) {
                return { ...s, questions: s.questions.filter((q) => q.id !== questionId) };
              }
              return s;
            })
          );
          mutate('/v1/admin/chat-center/faqs');
        } catch (error) {
          console.error(error);
          alert("حدث خطأ أثناء الحذف");
        }
      },
    });
  };

  // --- Modal Save Handler ---
  const handleModalSave = async (data: { title?: string; q?: string; a?: string }) => {
    try {
      if (actionModal.type === "section") {
        if (actionModal.isEdit) {
          await apiClient(`/v1/admin/chat-center/faqs/sections/${actionModal.sectionId}`, { 
            method: 'PUT', 
            body: { title: data.title! } 
          });
          setSections((prev) =>
            prev.map((s) => (s.id === actionModal.sectionId ? { ...s, title: data.title! } : s))
          );
        } else {
          const res = await apiClient(`/v1/admin/chat-center/faqs/sections`, { 
            method: 'POST', 
            body: { title: data.title!, order: sections.length + 1 } 
          });
          const newSectionId = res?.id || `sec-${Date.now()}`;
          setSections((prev) => [
            ...prev,
            { id: newSectionId, title: data.title!, questions: [] },
          ]);
        }
      } else if (actionModal.type === "question") {
        if (actionModal.isEdit) {
          await apiClient(`/v1/admin/chat-center/faqs/questions/${actionModal.questionId}`, { 
            method: 'PUT', 
            body: { question: data.q!, answer: data.a! } 
          });
          setSections((prev) =>
            prev.map((s) => {
              if (s.id === actionModal.sectionId) {
                return {
                  ...s,
                  questions: s.questions.map((q) =>
                    q.id === actionModal.questionId ? { ...q, q: data.q!, a: data.a! } : q
                  ),
                };
              }
              return s;
            })
          );
        } else {
          const targetSection = sections.find(s => s.id === actionModal.sectionId);
          const order = targetSection ? targetSection.questions.length + 1 : 1;
          const res = await apiClient(`/v1/admin/chat-center/faqs/questions`, { 
            method: 'POST', 
            body: { sectionId: actionModal.sectionId, question: data.q!, answer: data.a!, isActive: true, order } 
          });
          const newQuestionId = res?.id || `q-${Date.now()}`;
          
          setSections((prev) =>
            prev.map((s) => {
              if (s.id === actionModal.sectionId) {
                return {
                  ...s,
                  questions: [...s.questions, { id: newQuestionId, q: data.q!, a: data.a! }],
                };
              }
              return s;
            })
          );
        }
      }
      mutate('/v1/admin/chat-center/faqs');
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  // --- DND Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    let newItems: any[] = [];
    let type = "";

    if (activeId.startsWith("sec-") && overId.startsWith("sec-")) {
      type = "section";
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === overId);
        const moved = arrayMove(items, oldIndex, newIndex);
        newItems = moved.map((item, index) => ({ id: item.id, order: index + 1 }));
        return moved;
      });
    } else if (activeId.startsWith("q-") && overId.startsWith("q-")) {
      type = "question";
      setSections((prev) =>
        prev.map((s) => {
          const oldIndex = s.questions.findIndex((item) => item.id === activeId);
          const newIndex = s.questions.findIndex((item) => item.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            const moved = arrayMove(s.questions, oldIndex, newIndex);
            newItems = moved.map((item, index) => ({ id: item.id, order: index + 1 }));
            return {
              ...s,
              questions: moved,
            };
          }
          return s;
        })
      );
    }

    if (newItems.length > 0) {
      try {
        await apiClient('/v1/admin/chat-center/faqs/reorder', {
          method: 'PUT',
          body: { type, items: newItems }
        });
      } catch (error) {
        console.error("Reorder failed", error);
        mutate('/v1/admin/chat-center/faqs'); // Revert on failure
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">أقسام الأسئلة الشائعة</h2>
          <p className="text-sm text-slate-500 mt-1">
            قم بإدارة الأقسام والأسئلة التي تظهر للعملاء في واجهة المتجر بشكل تلقائي.
          </p>
        </div>
        <Button
          onClick={handleAddSectionClick}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 rounded-xl shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                isExpanded={expandedSection === section.id}
                onToggleExpand={() =>
                  setExpandedSection(expandedSection === section.id ? null : section.id)
                }
                onEditSection={handleEditSectionClick}
                onDeleteSection={handleDeleteSectionClick}
                onAddQuestion={handleAddQuestionClick}
                onEditQuestion={handleEditQuestionClick}
                onDeleteQuestion={handleDeleteQuestionClick}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Modals */}
      <FAQActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleModalSave}
        type={actionModal.type}
        isEdit={actionModal.isEdit}
        defaultValues={actionModal.defaultValues}
      />
      
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
