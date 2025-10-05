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

export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  // Expects a string like "2024-01-01" or an ISO string
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString; // Return original string if invalid
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Check if time is available (not midnight UTC)
  if (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
  }

  return `${year}.${month}.${day}`;
};