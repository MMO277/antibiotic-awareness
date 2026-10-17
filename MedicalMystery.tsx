import React from 'react';
import Cartoon3DGameShell from './Cartoon3DGameShell';
import { MEDICAL_MYSTERY_CONFIG } from './medicalMysteryData';

const MedicalMystery: React.FC = () => {
  return <Cartoon3DGameShell config={MEDICAL_MYSTERY_CONFIG} />;
};

export default MedicalMystery;
