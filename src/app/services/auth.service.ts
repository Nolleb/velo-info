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

  signOut(): Observable<void> {
    return from(signOut(this.auth));
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Returns true for Safari on macOS and all iOS browsers (which block OAuth popups).
   */
  private usesRedirect(): boolean {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return /^((?!chrome|android|firefox).)*safari/i.test(ua);
  }

  private upsertUserDoc(userCredential: any): Observable<any> {
    const u = userCredential.user;
    const userRef = doc(this.firestore, `users/${u.uid}`);
    return from(getDoc(userRef)).pipe(
      switchMap(docSnap => {
        if (!docSnap.exists()) {
          return from(setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            role: 'user',
          })).pipe(map(() => userCredential));
        } else {
          return from(setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          }, { merge: true })).pipe(map(() => userCredential));
        }
      })
    );
  }

  signInWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    if (this.usesRedirect()) {
      // Safari / iOS: popups are blocked — use redirect flow.
      // The result will be handled by handleRedirectResult() on the next page load.
      return from(signInWithRedirect(this.auth, provider));
    }
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => this.upsertUserDoc(result))
    );
  }

  /**
   * Call this once at app startup to capture the OAuth result after a redirect
   * (Safari / iOS flow). Returns null if no redirect was pending.
   */
  handleRedirectResult(): Observable<any> {
    return from(getRedirectResult(this.auth)).pipe(
      switchMap(result => {
        if (!result) return of(null);
        return this.upsertUserDoc(result);
      })
    );
  }
}
