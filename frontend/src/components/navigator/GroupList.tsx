import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Plus, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore, selectGroupsList, useUIStore } from '../../stores';

export function GroupList() {
  const groups = useWorkspaceStore(useShallow(selectGroupsList));
  const activeGroupId = useWorkspaceStore((state) => state.activeGroupId);
  const setActiveGroup = useWorkspaceStore((state) => state.setActiveGroup);
  const setViewMode = useWorkspaceStore((state) => state.setViewMode);

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between px-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
          Translation Groups
        </span>
        <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[11px] text-text-tertiary">
          {groups.length}
        </span>
      </div>

      <nav className="space-y-1">
        {groups.map((group) => (
          <GroupItem
            key={group.id}
            group={group}
            isActive={group.id === activeGroupId}
            onSelect={() => {
              setActiveGroup(group.id);
              setViewMode('editor');
            }}
          />
        ))}
      </nav>
    </div>
  );
}

interface GroupItemProps {
  group: ReturnType<typeof selectGroupsList>[0];
  isActive: boolean;
  onSelect: () => void;
}

function GroupItem({ group, isActive, onSelect }: GroupItemProps) {
  const [expanded, setExpanded] = useState(false);
  const activeLanguage = useWorkspaceStore((state) => state.activeLanguage);
  const setActiveLanguage = useWorkspaceStore((state) => state.setActiveLanguage);
  const openDialog = useUIStore((state) => state.openDialog);

  const languages = Array.from(group.files.keys()).sort((a, b) => {
    if (a === 'default') return -1;
    if (b === 'default') return 1;
    return a.localeCompare(b);
  });

  const translationCount = languages.filter(l => l !== 'default').length;

  return (
    <div>
      <div
        className={`group mx-2 flex cursor-pointer items-center gap-1 rounded-xl border px-2 py-1.5 transition-all ${
          isActive
            ? 'border-accent/40 bg-accent-light text-accent shadow-[var(--shadow-sm)]'
            : 'border-transparent text-text-primary hover:border-border-subtle hover:bg-bg-tertiary/65'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="rounded-md p-0.5 hover:bg-bg-tertiary"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
          )}
        </button>

        <button
          onClick={onSelect}
          className="flex flex-1 items-center gap-2 overflow-hidden text-left"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">{group.baseName}</span>
          {translationCount > 0 && (
            <span className="ml-auto shrink-0 rounded-full bg-bg-tertiary px-1.5 py-0.5 text-xs text-text-tertiary">
              {translationCount}
            </span>
          )}
        </button>

        {/* Add language button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDialog('add-language', { groupId: group.id });
          }}
          className="rounded-md p-0.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary hover:text-text-primary"
          title="Add language"
        >
          <Plus className="h-3.5 w-3.5 text-text-tertiary" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-5 mr-2 border-l border-border-subtle pl-2">
              {languages.map((lang) => (
                <LanguageItem
                  key={lang}
                  language={lang}
                  isActive={isActive && activeLanguage === lang}
                  onSelect={() => {
                    onSelect();
                    setActiveLanguage(lang);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LanguageItemProps {
  language: string;
  isActive: boolean;
  onSelect: () => void;
}

function LanguageItem({ language, isActive, onSelect }: LanguageItemProps) {
  const displayName = language === 'default' ? 'Source' : language.toUpperCase();

  return (
    <button
      onClick={onSelect}
      className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
        isActive
          ? 'bg-accent-light text-accent'
          : 'text-text-secondary hover:bg-bg-tertiary/70 hover:text-text-primary'
      }`}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{displayName}</span>
    </button>
  );
}
