document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const modal = document.getElementById('successModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  
  // 입력 요소들
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('passwordConfirm');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const agreeTermsCheckbox = document.getElementById('agreeTerms');
  const btnTogglePassword = document.querySelector('.btn-toggle-password');
  
  // 비밀번호 강도 바 요소
  const strengthMeter = document.querySelector('.pw-strength-meter');
  const strengthBar = document.querySelector('.strength-bar');

  // 각 필드의 최초 검증 여부 추적 (사용자가 한번이라도 입력에서 포커스를 벗어난 후부터 실시간 검증을 적용하기 위함)
  const touchedFields = {
    username: false,
    password: false,
    passwordConfirm: false,
    email: false,
    phone: false,
    terms: false
  };

  /* ==========================================================================
     1. 유효성 검사 정규표현식 및 메시지 정의
     ========================================================================== */
  const validationRules = {
    username: {
      regex: /^[a-z0-9]{4,15}$/,
      emptyMsg: '아이디를 입력해 주세요.',
      invalidMsg: '아이디는 4~15자의 영문 소문자 및 숫자 조합이어야 합니다.'
    },
    password: {
      // 영문 대소문자, 숫자, 특수문자 조합 8자 이상
      regex: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`\-={}\[\]:;"'<>,.?\/]).{8,}$/,
      emptyMsg: '비밀번호를 입력해 주세요.',
      invalidMsg: '비밀번호는 영문, 숫자, 특수문자 조합 8자 이상이어야 합니다.'
    },
    email: {
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      emptyMsg: '이메일 주소를 입력해 주세요.',
      invalidMsg: '유효한 이메일 형식(example@yju.ac.kr)이 아닙니다.'
    },
    phone: {
      regex: /^010-\d{3,4}-\d{4}$/,
      emptyMsg: '전화번호를 입력해 주세요.',
      invalidMsg: '올바른 휴대폰 번호 형식(010-XXXX-XXXX)이 아닙니다.'
    }
  };

  /* ==========================================================================
     2. 공통 유효성 검사 헬퍼 함수
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
    const group = inputElement.closest('.input-group') || inputElement.closest('.terms-group');
    group.classList.remove('shake-anim');
    // 브라우저 리플로우 트리거하여 애니메이션 초기화
    void group.offsetWidth; 
    group.classList.add('shake-anim');
    
    // 애니메이션 종료 시 클래스 제거
    setTimeout(() => {
      group.classList.remove('shake-anim');
    }, 400);
  }

  /* ==========================================================================
     3. 필드별 검증 로직
     ========================================================================== */
  
  // [아이디 검증]
  function validateUsername() {
    const val = usernameInput.value.trim();
    if (!val) {
      showError(usernameInput, validationRules.username.emptyMsg);
      return false;
    }
    if (!validationRules.username.regex.test(val)) {
      showError(usernameInput, validationRules.username.invalidMsg);
      return false;
    }
    showSuccess(usernameInput);
    return true;
  }

  // [비밀번호 강도 평가]
  function checkPasswordStrength(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++; // 대소문자 혼합
    if (/\d/.test(val)) score++; // 숫자 포함
    if (/[!@#$%^&*()_+~`\-={}\[\]:;"'<>,.?\/]/.test(val)) score++; // 특수문자 포함
    
    // 색상 및 길이 설정
    let width = '0%';
    let color = 'var(--error)';
    
    if (val.length > 0) {
      strengthMeter.style.display = 'block';
      if (score === 1) {
        width = '25%';
        color = 'var(--error)';
      } else if (score === 2) {
        width = '50%';
        color = 'var(--warning)';
      } else if (score === 3) {
        width = '75%';
        color = '#eab308'; // 노랑
      } else if (score === 4) {
        width = '100%';
        color = 'var(--success)';
      }
    } else {
      strengthMeter.style.display = 'none';
    }
    
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
  }

  // [비밀번호 검증]
  function validatePassword() {
    const val = passwordInput.value;
    checkPasswordStrength(val);
    
    if (!val) {
      showError(passwordInput, validationRules.password.emptyMsg);
      return false;
    }
    if (!validationRules.password.regex.test(val)) {
      showError(passwordInput, validationRules.password.invalidMsg);
      return false;
    }
    showSuccess(passwordInput);
    
    // 비밀번호가 유효하게 변경되었을 때, 비밀번호 확인 필드도 재검사 실행
    if (touchedFields.passwordConfirm && passwordConfirmInput.value) {
      validatePasswordConfirm();
    }
    return true;
  }

  // [비밀번호 확인 검증]
  function validatePasswordConfirm() {
    const val = passwordConfirmInput.value;
    const originalVal = passwordInput.value;
    
    if (!val) {
      showError(passwordConfirmInput, '비밀번호 확인을 입력해 주세요.');
      return false;
    }
    if (val !== originalVal) {
      showError(passwordConfirmInput, '입력하신 비밀번호와 다릅니다. 동일하게 입력해 주세요.');
      return false;
    }
    showSuccess(passwordConfirmInput);
    return true;
  }

  // [이메일 검증]
  function validateEmail() {
    const val = emailInput.value.trim();
    if (!val) {
      showError(emailInput, validationRules.email.emptyMsg);
      return false;
    }
    if (!validationRules.email.regex.test(val)) {
      showError(emailInput, validationRules.email.invalidMsg);
      return false;
    }
    showSuccess(emailInput);
    return true;
  }

  // [전화번호 자동 포맷팅 및 검증]
  function formatPhone(input) {
    // 숫자 이외의 문자 제거
    let val = input.value.replace(/[^0-9]/g, '');
    let formatted = '';
    
    if (val.length < 4) {
      formatted = val;
    } else if (val.length < 7) {
      formatted = val.substring(0, 3) + '-' + val.substring(3);
    } else if (val.length < 11) {
      formatted = val.substring(0, 3) + '-' + val.substring(3, 6) + '-' + val.substring(6);
    } else {
      formatted = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7, 11);
    }
    
    input.value = formatted;
  }

  function validatePhone() {
    const val = phoneInput.value.trim();
    if (!val) {
      showError(phoneInput, validationRules.phone.emptyMsg);
      return false;
    }
    if (!validationRules.phone.regex.test(val)) {
      showError(phoneInput, validationRules.phone.invalidMsg);
      return false;
    }
    showSuccess(phoneInput);
    return true;
  }

  // [약관 동의 검증]
  function validateTerms() {
    const errorMsg = document.getElementById('error-terms');
    if (!agreeTermsCheckbox.checked) {
      errorMsg.textContent = '개인정보 이용약관에 동의하셔야 회원가입이 가능합니다.';
      errorMsg.style.opacity = '1';
      errorMsg.style.transform = 'translateY(0)';
      return false;
    } else {
      errorMsg.textContent = '';
      errorMsg.style.opacity = '0';
      errorMsg.style.transform = 'translateY(-5px)';
      return true;
    }
  }

  /* ==========================================================================
     4. 이벤트 리스너 등록 (실시간 검증용)
     ========================================================================== */

  // blur 시 touched 활성화 후 검증 실행
  usernameInput.addEventListener('blur', () => { touchedFields.username = true; validateUsername(); });
  passwordInput.addEventListener('blur', () => { touchedFields.password = true; validatePassword(); });
  passwordConfirmInput.addEventListener('blur', () => { touchedFields.passwordConfirm = true; validatePasswordConfirm(); });
  emailInput.addEventListener('blur', () => { touchedFields.email = true; validateEmail(); });
  phoneInput.addEventListener('blur', () => { touchedFields.phone = true; validatePhone(); });
  agreeTermsCheckbox.addEventListener('change', () => { touchedFields.terms = true; validateTerms(); });

  // input 시 실시간 검증 (사용자가 한번 blur 한 이후에만 동작하도록 제한하여 초기 타이핑 UX 향상)
  usernameInput.addEventListener('input', () => { if (touchedFields.username) validateUsername(); });
  passwordInput.addEventListener('input', (e) => {
    checkPasswordStrength(e.target.value);
    if (touchedFields.password) validatePassword();
  });
  passwordConfirmInput.addEventListener('input', () => { if (touchedFields.passwordConfirm) validatePasswordConfirm(); });
  emailInput.addEventListener('input', () => { if (touchedFields.email) validateEmail(); });
  
  phoneInput.addEventListener('input', (e) => {
    formatPhone(e.target);
    if (touchedFields.phone) validatePhone();
  });

  // 비밀번호 표시 토글 기능
  btnTogglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    btnTogglePassword.classList.toggle('active', isPassword);
    
    // 시각 보조 기술용 웹접근성 라벨 갱신
    btnTogglePassword.setAttribute(
      'aria-label',
      isPassword ? '비밀번호 숨기기' : '비밀번호 표시'
    );
  });

  /* ==========================================================================
     5. 폼 제출 처리 및 가입 성공 모달 제어
     ========================================================================== */
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // 기본 서버 전송 동작 차단

    // 모든 필드 touched 상태로 전환하여 에러가 즉시 드러나게 함
    Object.keys(touchedFields).forEach(key => touchedFields[key] = true);

    // 전체 검증 실행
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    const isPasswordConfirmValid = validatePasswordConfirm();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isTermsValid = validateTerms();

    const isFormValid = isUsernameValid && isPasswordValid && isPasswordConfirmValid && 
                        isEmailValid && isPhoneValid && isTermsValid;

    if (isFormValid) {
      // 폼 데이터 수집
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();

      // 모달 데이터 세팅
      document.getElementById('summary-username').textContent = username;
      document.getElementById('summary-email').textContent = email;
      document.getElementById('summary-phone').textContent = phone;

      // 성공 모달 열기
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      
      // 모달 외부 포커스 방지를 위해 닫기 버튼에 포커스
      modalCloseBtn.focus();
    } else {
      // 유효성 검사에 실패한 첫 번째 요소에 진동 효과를 주어 사용자 주의 환기
      if (!isUsernameValid) triggerShake(usernameInput);
      else if (!isPasswordValid) triggerShake(passwordInput);
      else if (!isPasswordConfirmValid) triggerShake(passwordConfirmInput);
      else if (!isEmailValid) triggerShake(emailInput);
      else if (!isPhoneValid) triggerShake(phoneInput);
      else if (!isTermsValid) triggerShake(agreeTermsCheckbox);
    }
  });

  // 모달 닫기 (다음 페이지로 이동)
  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    
    const username = document.getElementById('summary-username').textContent;
    const email = document.getElementById('summary-email').textContent;
    const phone = document.getElementById('summary-phone').textContent;
    
    // 회원가입 성공 다음페이지로 리다이렉트
    window.location.href = `welcome.html?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
  }

  modalCloseBtn.addEventListener('click', closeModal);

  // ESC 키 클릭 시 모달 닫기 처리
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
});
