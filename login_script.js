document.addEventListener('DOMContentLoaded', () => {
  // Supabase 클라이언트 설정
  const supabaseUrl = 'https://yavgvmkllkipdobrpqfg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhdmd2bWtsbGtpcGRvYnJwcWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDcyODYsImV4cCI6MjA5ODQyMzI4Nn0.BGeCdEFD6gqbJBjo87qJyAzHNNg5D0pxYOpt1-uhCrI';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const form = document.getElementById('loginForm');
  const modal = document.getElementById('loginSuccessModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  
  // 입력 요소들
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveIdCheckbox = document.getElementById('saveId');
  const keepLoginCheckbox = document.getElementById('keepLogin');
  const btnTogglePassword = document.querySelector('.btn-toggle-password');
  const welcomeMessage = document.getElementById('welcome-message');

  // 각 필드의 최초 검증 여부 추적
  const touchedFields = {
    username: false,
    password: false
  };

  /* ==========================================================================
     1. 유효성 검사 헬퍼 함수
     ========================================================================== */
  function showSuccess(inputElement) {
    const group = inputElement.closest('.input-group');
    group.classList.remove('error');
    group.classList.add('success');
    
    const errorMsg = group.querySelector('.validation-message');
    if (errorMsg) {
      errorMsg.textContent = '';
    }
  }

  function showError(inputElement, message) {
    const group = inputElement.closest('.input-group');
    group.classList.remove('success');
    group.classList.add('error');
    
    const errorMsg = group.querySelector('.validation-message');
    if (errorMsg) {
      errorMsg.textContent = message;
    }
  }

  function triggerShake(inputElement) {
    const group = inputElement.closest('.input-group');
    group.classList.remove('shake-anim');
    void group.offsetWidth; // 리플로우 트리거
    group.classList.add('shake-anim');
    
    setTimeout(() => {
      group.classList.remove('shake-anim');
    }, 400);
  }

  /* ==========================================================================
     2. 필드별 검증 로직
     ========================================================================== */
  function validateUsername() {
    const val = usernameInput.value.trim();
    if (!val) {
      showError(usernameInput, '아이디를 입력해 주세요.');
      return false;
    }
    showSuccess(usernameInput);
    return true;
  }

  function validatePassword() {
    const val = passwordInput.value;
    if (!val) {
      showError(passwordInput, '비밀번호를 입력해 주세요.');
      return false;
    }
    showSuccess(passwordInput);
    return true;
  }

  /* ==========================================================================
     3. 이벤트 리스너 및 입력값 처리
     ========================================================================== */
  usernameInput.addEventListener('blur', () => { touchedFields.username = true; validateUsername(); });
  passwordInput.addEventListener('blur', () => { touchedFields.password = true; validatePassword(); });

  usernameInput.addEventListener('input', () => { if (touchedFields.username) validateUsername(); });
  passwordInput.addEventListener('input', () => { if (touchedFields.password) validatePassword(); });

  // 비밀번호 표시 토글
  btnTogglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    btnTogglePassword.classList.toggle('active', isPassword);
    btnTogglePassword.setAttribute('aria-label', isPassword ? '비밀번호 숨기기' : '비밀번호 표시');
  });

  /* ==========================================================================
     4. URL 파라미터 또는 회원가입 직후 데이터 로드
     ========================================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const signupUsername = urlParams.get('username');
  if (signupUsername) {
    usernameInput.value = signupUsername;
    // 회원가입 성공 후 가입 정보 유지를 보여주기 위해 비밀번호 자동 입력
    passwordInput.value = 'Yjutest123!';
    
    touchedFields.username = true;
    touchedFields.password = true;
    validateUsername();
    validatePassword();
  } else {
    // 일반 접근 시 테스트 편의를 위해 임시 기본값 prefill
    usernameInput.value = 'yjutest123';
    passwordInput.value = 'Yjutest123!';
    touchedFields.username = true;
    touchedFields.password = true;
    validateUsername();
    validatePassword();
  }

  /* ==========================================================================
     5. 폼 제출 처리 및 로그인 성공 모달
     ========================================================================== */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    touchedFields.username = true;
    touchedFields.password = true;

    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();

    if (isUsernameValid && isPasswordValid) {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      // Supabase 로그인 검증
      (async () => {
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text') || submitBtn;
        const originalText = btnText.textContent;
        if (btnText.textContent) btnText.textContent = '로그인 중...';
        submitBtn.disabled = true;

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .maybeSingle();

          if (error) {
            console.error('Supabase login error:', error);
            alert('로그인 처리 중 오류가 발생했습니다: ' + error.message);
            return;
          }

          if (!data) {
            // 로그인 실패
            showError(usernameInput, '아이디 또는 비밀번호가 일치하지 않습니다.');
            showError(passwordInput, '아이디 또는 비밀번호가 일치하지 않습니다.');
            triggerShake(usernameInput);
            triggerShake(passwordInput);
            return;
          }

          // 로그인 성공
          welcomeMessage.textContent = `${data.username}님, 환영합니다!`;
          
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
          modalCloseBtn.focus();
        } catch (err) {
          console.error(err);
          alert('네트워크 오류가 발생했습니다.');
        } finally {
          if (btnText.textContent) btnText.textContent = originalText;
          submitBtn.disabled = false;
        }
      })();
    } else {
      if (!isUsernameValid) triggerShake(usernameInput);
      else if (!isPasswordValid) triggerShake(passwordInput);
    }
  });

  // 모달 닫기
  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    // 실제 사이트로 리다이렉트 예시
    window.location.href = 'https://www.yju.ac.kr';
  }

  modalCloseBtn.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
});
