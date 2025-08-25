import { db } from './db';
import { categories } from '@shared/schema';

export async function initializeCategories() {
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length > 0) {
      console.log('Categories already initialized');
      return;
    }

    const defaultCategories = [
      {
        name: 'Belleza',
        slug: 'belleza',
        description: 'Servicios de belleza, cuidado personal y estética',
        icon: 'Scissors',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Tecnología',
        slug: 'tecnologia',
        description: 'Desarrollo web, aplicaciones y servicios tecnológicos',
        icon: 'Laptop',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Hogar',
        slug: 'hogar',
        description: 'Servicios para el hogar, limpieza y mantenimiento',
        icon: 'Home',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Automotriz',
        slug: 'automotriz',
        description: 'Servicios automotrices, mecánica y mantenimiento',
        icon: 'Car',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Educación',
        slug: 'educacion',
        description: 'Clases particulares, tutorías y cursos',
        icon: 'GraduationCap',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Salud',
        slug: 'salud',
        description: 'Servicios de salud y bienestar',
        icon: 'Stethoscope',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Eventos',
        slug: 'eventos',
        description: 'Organización de eventos y celebraciones',
        icon: 'PartyPopper',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Limpieza',
        slug: 'limpieza',
        description: 'Servicios de limpieza residencial y comercial',
        icon: 'Sparkles',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Entrenamiento',
        slug: 'entrenamiento',
        description: 'Entrenamiento personal y fitness',
        icon: 'Dumbbell',
        color: 'from-blue-100 to-blue-200'
      },
      {
        name: 'Diseño',
        slug: 'diseno',
        description: 'Diseño gráfico, web y servicios creativos',
        icon: 'Paintbrush2',
        color: 'from-blue-100 to-blue-200'
      }
    ];

    await db.insert(categories).values(defaultCategories);
    console.log('Default categories initialized successfully');
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}