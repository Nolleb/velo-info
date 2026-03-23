import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, user, User } from '@angular/fire/auth';
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
    // iOS Safari blocks async-opened popups (WebKit policy).
    // Use redirect flow on iOS; popup on every other browser.
    if (this.isIos()) {
      return from(signInWithRedirect(this.auth, provider));
    }
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => this.upsertUser(result))
    );
  }

  /**
   * Must be called once at app startup to resolve a pending redirect login
   * (iOS flow). Returns null when no redirect was in progress.
   */
  handleRedirectResult(): Observable<any> {
    return from(getRedirectResult(this.auth)).pipe(
      switchMap(result => result ? this.upsertUser(result) : of(null))
    );
  }

  private isIos(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  private upsertUser(result: any): Observable<any> {
    const u = result.user;
    const userRef = doc(this.firestore, `users/${u.uid}`);
    return from(getDoc(userRef)).pipe(
      switchMap(docSnap => {
        if (!docSnap.exists()) {
          return from(setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            role: 'user',
          })).pipe(map(() => result));
        } else {
          return from(setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          }, { merge: true })).pipe(map(() => result));
        }
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
