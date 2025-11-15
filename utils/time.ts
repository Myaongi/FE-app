import { Post } from '../types';

export const normalizeDate = (dateInput: number[] | string | Date): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    // 빈 문자열이나 유효하지 않은 문자열은 Invalid Date를 반환하도록 처리
    return dateInput ? new Date(dateInput) : new Date(NaN);
  }
  if (Array.isArray(dateInput) && dateInput.length > 0) {
    // 배열의 각 요소에 기본값을 제공하여 undefined가 생성자에 전달되는 것을 방지
    const year = dateInput[0] || 0;
    const month = dateInput[1] ? dateInput[1] - 1 : 0; // 월은 0부터 시작
    const day = dateInput[2] || 1;
    const hour = dateInput[3] || 0;
    const minute = dateInput[4] || 0;
    const second = dateInput[5] || 0;
    const millisecond = dateInput[6] || 0;
    return new Date(year, month, day, hour, minute, second, millisecond);
  }
  // 유효하지 않은 타입이나 빈 배열은 Invalid Date 반환
  return new Date(NaN);
};

// 1분 미만: "방금 전"

// 1분 이상 ~ 59분 이하: "몇 분 전"

// 1시간 이상 ~ 23시간 이하: "몇 시간 전"

// 1일 이상 ~ 6일 이하: "몇 일 전"

// 7일 이상 ~ 29일 이하: "몇 주 전" (1주, 2주, 3주, 4주 전까지 표시될 수 있습니다. Math.floor로 계산되기 때문입니다.)

// 30일 이상 ~ 364일 이하: "몇 개월 전"

// 365일 이상: "몇 년 전"
export const formatRelativeTime = (isoString: string): string => {
  const uploadedDate = new Date(isoString);

  if (isNaN(uploadedDate.getTime())) {
    return isoString;
  }

  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - uploadedDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInMinutes < 60 * 24) {
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}시간 전`;
  } else if (diffInMinutes < 60 * 24 * 7) {
    const diffInDays = Math.floor(diffInMinutes / (60 * 24));
    return `${diffInDays}일 전`;
  } else if (diffInMinutes < 60 * 24 * 30) {
    const diffInWeeks = Math.floor(diffInMinutes / (60 * 24 * 7));
    return `${diffInWeeks}주 전`;
  } else if (diffInMinutes < 60 * 24 * 365) {
    const diffInMonths = Math.floor(diffInMinutes / (60 * 24 * 30));
    return `${diffInMonths}개월 전`;
  } else {
    const diffInYears = Math.floor(diffInMinutes / (60 * 24 * 365));
    return `${diffInYears}년 전`;
  }
};

export const formatDisplayDate = (dateArray: number[] | string | Date): string => {
  const date = normalizeDate(dateArray);
  if (isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}. ${month}. ${day}.`;
};

export const formatTime = (dateArray: number[] | string | Date): string => {
  const date = normalizeDate(dateArray);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};