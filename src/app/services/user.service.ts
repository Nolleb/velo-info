import { Injectable, inject } from '@angular/core';
import { CollectionReference, Firestore, collection, collectionData, doc, updateDoc, arrayUnion, arrayRemove, docData } from '@angular/fire/firestore';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  usersResource = rxResource<User[], unknown>({
    stream: () => {
      const userCollection = collection(this.firestore, 'users') as CollectionReference<User>;
      return collectionData<User>(userCollection, { idField: 'id' })
    }
  });

  /**
   * Récupérer le rôle d'un utilisateur
   */
  getUserRole(userId: string): Observable<string> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData(userRef).pipe(
      map((userData: any) => {
        const role = userData?.role || 'user';
        return role;
      })
    );
  }

  /**
   * Récupérer les informations complètes d'un utilisateur
   */
  getUserById(userId: string): Observable<User | null> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData(userRef, { idField: 'id' }) as Observable<User>;
  }
}

