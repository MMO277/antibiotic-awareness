import React from 'react';
import Cartoon3DGameShell from './Cartoon3DGameShell';
import { NURSE_ACADEMY_CONFIG } from './nurseAcademyData';

const NurseAcademy: React.FC = () => {
  return <Cartoon3DGameShell config={NURSE_ACADEMY_CONFIG} />;
};

export default NurseAcademy;
