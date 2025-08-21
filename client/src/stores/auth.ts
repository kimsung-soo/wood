import { defineStore } from 'pinia';
import { router } from '@/router';

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    // localStorage에서 사용자 불러오기 (새로고침 유지용)
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    returnUrl: null as string | null
  }),
  actions: {
    async login(email: string, password: string) {
      try {
        // 프론트 → 백엔드 로그인 요청
        const res = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, pwd: password })
        });

        const data = await res.json();

        if (data.result) {
          // 로그인 성공 → Pinia state + localStorage 갱신
          this.user = { email: data.email, name: data.name, auth: data.auth };
          localStorage.setItem('user', JSON.stringify(this.user));

          router.push(this.returnUrl || '/dashboard/default');
        } else {
          alert(data.message || '로그인 실패');
        }
      } catch (err) {
        console.error('로그인 에러:', err);
      }
    },

    async logout() {
      try {
        await fetch('http://localhost:3000/logout', {
          method: 'GET',
          credentials: 'include'
        });
      } catch (err) {
        console.error('로그아웃 에러:', err);
      } finally {
        this.user = null;
        localStorage.removeItem('user');
        router.push('/login');
      }
    }
  }
});
