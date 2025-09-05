import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Note as NoteIcon } from '@mui/icons-material';
import type { AssetNotes } from '../../../types/document.types';

interface AssetNotesProps {
  notes: AssetNotes;
  onNoteSave: (noteField: keyof AssetNotes, value: string) => void;
}

interface NoteAccordionProps {
  noteNumber: number;
  subject: string | null | undefined;
  note: string | null | undefined;
  onSubjectChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}

const NoteSubjectField: React.FC<{
  subject: string | null | undefined;
  onSubjectChange: (value: string) => void;
}> = ({ subject, onSubjectChange }) => (
  <TextField
    fullWidth
    label="Subject"
    value={subject || ''}
    onChange={(e): void => onSubjectChange(e.target.value)}
    size="small"
    sx={{ mb: 2 }}
  />
);

const NoteTextField: React.FC<{
  note: string | null | undefined;
  onNoteChange: (value: string) => void;
}> = ({ note, onNoteChange }) => (
  <TextField
    fullWidth
    label="Note"
    value={note || ''}
    onChange={(e): void => onNoteChange(e.target.value)}
    multiline
    rows={3}
    size="small"
  />
);

const NoteFields: React.FC<{
  subject: string | null | undefined;
  note: string | null | undefined;
  onSubjectChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}> = ({ subject, note, onSubjectChange, onNoteChange }) => (
  <Box sx={{ width: '100%' }}>
    <NoteSubjectField subject={subject} onSubjectChange={onSubjectChange} />
    <NoteTextField note={note} onNoteChange={onNoteChange} />
  </Box>
);

const NoteAccordion: React.FC<NoteAccordionProps> = ({
  noteNumber,
  subject,
  note,
  onSubjectChange,
  onNoteChange,
}) => (
  <Accordion defaultExpanded={noteNumber === 1}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>
        Note {noteNumber}: {subject || '(No subject)'}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <NoteFields
        subject={subject}
        note={note}
        onSubjectChange={onSubjectChange}
        onNoteChange={onNoteChange}
      />
    </AccordionDetails>
  </Accordion>
);

export const AssetNotesPanel: React.FC<AssetNotesProps> = ({ notes, onNoteSave }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      <NoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
      Asset Notes
    </Typography>

    {[1, 2, 3, 4, 5, 6].map((num) => {
      const subjectKey = `note${num}Subject` as keyof AssetNotes;
      const noteKey = `note${num}` as keyof AssetNotes;

      return (
        <NoteAccordion
          key={num}
          noteNumber={num}
          subject={notes[subjectKey]}
          note={notes[noteKey]}
          onSubjectChange={(value): void => onNoteSave(subjectKey, value)}
          onNoteChange={(value): void => onNoteSave(noteKey, value)}
        />
      );
    })}
  </Paper>
);