import { db, withRetry, handleFirebaseError } from './firebase';
import { doc, setDoc, getDoc, Timestamp, DocumentReference } from 'firebase/firestore';
import { LayoutItem, Widget } from '@/types';

// Interface for saved dashboard data
export interface UserDashboard {
  layouts: {
    [breakpoint: string]: LayoutItem[];
  };
  widgets: Widget[];
  lastUpdated: Timestamp;
}

// Type for dashboard data without timestamp (for saving)
type DashboardData = Omit<UserDashboard, 'lastUpdated'> & {
  lastUpdated: Timestamp;
};

/**
 * Save user's dashboard configuration
 * @param userId - The user's ID
 * @param layouts - The dashboard layouts
 * @param widgets - The dashboard widgets
 * @returns Promise<boolean> - True if save was successful
 * @throws {FirebaseError} If the operation fails
 */
export async function saveDashboard(
  userId: string, 
  layouts: UserDashboard['layouts'], 
  widgets: Widget[]
): Promise<boolean> {
  try {
    const docRef: DocumentReference = doc(db, 'userDashboards', userId);
    const dashboardData: DashboardData = {
      layouts,
      widgets,
      lastUpdated: Timestamp.now()
    };

    await withRetry(() => setDoc(docRef, dashboardData));
    return true;
  } catch (error) {
    handleFirebaseError(error);
  }
}

/**
 * Load user's dashboard configuration
 * @param userId - The user's ID
 * @returns Promise<UserDashboard | null> - The dashboard data or null if not found
 * @throws {FirebaseError} If the operation fails
 */
export async function loadDashboard(userId: string): Promise<UserDashboard | null> {
  try {
    const docRef: DocumentReference = doc(db, 'userDashboards', userId);
    const docSnap = await withRetry(() => getDoc(docRef));
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DashboardData;
      return {
        layouts: data.layouts,
        widgets: data.widgets,
        lastUpdated: data.lastUpdated
      };
    }
    return null; // User has no saved dashboard yet
  } catch (error) {
    handleFirebaseError(error);
  }
} 