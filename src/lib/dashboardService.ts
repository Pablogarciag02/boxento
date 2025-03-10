import { db } from './firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { LayoutItem, Widget } from '@/types';

// Interface for saved dashboard data
interface UserDashboard {
  layouts: {
    [breakpoint: string]: LayoutItem[];
  };
  widgets: Widget[];
  lastUpdated: Timestamp;
}

// Save user's dashboard configuration
export async function saveDashboard(userId: string, layouts: any, widgets: Widget[]) {
  try {
    await setDoc(doc(db, 'userDashboards', userId), {
      layouts,
      widgets,
      lastUpdated: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving dashboard:', error);
    return false;
  }
}

// Load user's dashboard configuration
export async function loadDashboard(userId: string): Promise<UserDashboard | null> {
  try {
    const docRef = doc(db, 'userDashboards', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserDashboard;
    } else {
      return null; // User has no saved dashboard yet
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return null;
  }
} 