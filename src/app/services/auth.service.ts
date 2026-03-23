import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { from, Observable, switchMap, map, of } from 'rxjs';
import { AuthUserWithRole, Role } from '../models/user.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private userService = inject(UserService);
  
  user$ = user(this.auth);
  
  // Observable qui combine automatiquement user$ avec le role depuis Firestore
  userWithRole$ = this.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);
      
      return this.userService.getUserRole(user.uid).pipe(
        map(roleString => {
          const role = roleString === 'admin' ? Role.ADMIN : Role.USER;
          const userWithRole = {
            ...user,
            role
          } as AuthUserWithRole;
          return userWithRole;
        })
      );
    })
  );

  signInWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => {
        const user = result.user;
        const userRef = doc(this.firestore, `users/${user.uid}`);
        
        return from(getDoc(userRef)).pipe(
          switchMap(docSnap => {
            if (!docSnap.exists()) {
              // Créer le document seulement s'il n'existe pas
              return from(setDoc(userRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'user',
              })).pipe(
                map(() => result)
              );
            } else {
              // Mettre à jour uniquement les infos de profil
              return from(setDoc(userRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              }, { merge: true })).pipe(
                map(() => result)
              );
            }
          })
        );
      })
    );
  }

  signOut(): Observable<void> {
    return from(signOut(this.auth));
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

}

