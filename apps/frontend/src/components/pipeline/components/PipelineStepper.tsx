import React from 'react';
import { Stepper, Step, StepLabel } from '@mui/material';
import { PIPELINE_STEPS } from '../utils/pipelineSteps';

interface PipelineStepperProps {
  currentStep: number;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ 
  currentStep 
}) => (
  <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
    {PIPELINE_STEPS.map((step) => (
      <Step key={step.label}>
        <StepLabel>{step.label}</StepLabel>
      </Step>
    ))}
  </Stepper>
);