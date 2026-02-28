import { Metadata } from 'next';
import GroundTruthClient from './GroundTruthClient';

export const metadata: Metadata = {
  title: 'Careers: The Ground Truth Task Force — GreenLine365',
  description: 'We are building the Source of Truth for the physical world. Join the Ground Truth Task Force — Certified Field Auditors, Hyper-Local Journalists, and Neighborhood Shield verification teams.',
};

export default function CareersPage() {
  return <GroundTruthClient />;
}
