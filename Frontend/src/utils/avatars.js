import React from 'react';
import { User as UserIcon } from 'lucide-react';

export const AVATARS = [
  { id: 'none', name: 'None (Default)', icon: UserIcon },
  { id: 'harry', name: 'Harry Potter', image: '/avatars/harry.png' },
  { id: 'hermione', name: 'Hermione Granger', image: '/avatars/hermione.png' },
  { id: 'dumbledore', name: 'Albus Dumbledore', image: '/avatars/dumbledore.png' },
  { id: 'draco', name: 'Draco Malfoy', image: '/avatars/draco.png' },
  { id: 'ron', name: 'Ron Weasley', image: '/avatars/ron.png' },
];

export const getAvatarIcon = (id) => {
  const avatar = AVATARS.find(a => a.id === id);
  if (!avatar || avatar.id === 'none') return UserIcon;
  return () => React.createElement('img', {
    src: avatar.image,
    alt: avatar.name,
    className: `object-cover rounded-full w-full h-full`
  });
};
