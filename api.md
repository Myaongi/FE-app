잃어버렸어요 게시물 관련 API
1.	/api/lost-posts (GET) 잃어버렸어요 게시글 목록 조회
A.	Parameters: page (페이지 번호. 0부터 시작.) , size (페이지 크기. Default=20)
B.	Responses
2.	{
3.	  "isSuccess": true,
4.	  "code": "COMMON200",
5.	  "message": "SUCCESS!",
6.	  "result": {
7.	    "content": [
8.	      {
9.	        "id": 1,
10.	        "title": "강아지를 잃어버렸습니다",
11.	        "dogType": "말티즈",
12.	        "dogColor": "흰색",
13.	        "location": "TODO: 행정동/구 단위 위치 정보",
14.	        "lostDateTime": [
15.	          2024,
16.	          1,
17.	          1,
18.	          14,
19.	          30,
20.	          0,
21.	          0
22.	        ],
23.	        "image": "https://s3.amazonaws.com/bucket/presigned-url-example",
24.	        "status": "MISSING"
25.	      },
26.	      {
27.	        "id": 2,
28.	        "title": "골든 리트리버를 잃어버렸습니다",
29.	        "dogType": "골든 리트리버",
30.	        "dogColor": "갈색",
31.	        "location": "TODO: 행정동/구 단위 위치 정보",
32.	        "lostDateTime": [
33.	          2024,
34.	          1,
35.	          1,
36.	          13,
37.	          0,
38.	          0,
39.	          0
40.	        ],
41.	        "image": "https://s3.amazonaws.com/bucket/presigned-url-example2",
42.	        "status": "SIGHTED"
43.	      }
44.	    ],
45.	    "hasNext": true
46.	  }
47.	}

2. /api/lost-posts (POST) 분실물 게시글 작성 Multipart/form-data 형식으로 data(json)와 images(이미지 파일) 전송함.
    A. 작성 예시(data):
    { "title": "강아지를 잃어버렸습니다", "dogName": "멍멍이", "dogType": "골든 리트리버", "dogColor": "갈색", "dogGender": "FEMALE", "features": "귀여운 목걸이", "lostDate": [2024, 1, 1], "lostTime": [2024, 1, 1, 14, 30, 0, 0], "lostLongitude": 127.0276, "lostLatitude": 37.4979 }
    B. Request
    data (string), images (array(
    C. Responses
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "memberName": "홍길동",
    "postTitle": "강아지를 잃어버렸습니다",
    "postDate": [
      2024,
      1,
      1,
      12,
      0,
      0,
      0
    ],
    "dogStatus": "MISSING"
  }
}

    3. /api/lost-posts/{postLostId}/reports (POST) 잃어버렸어요 게시글 신고
Parameters : postLostId (interger)
Request body :
{
  "reportType": "FAKE",
  "reportContent": "string"
}
Responses :
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "createdAt": "2024-01-01T12:00:00"
  }
}
    4. /api/lost-posts/{postLostId} (GET) 잃어버렸어요 게시글 상세 조회
Parameters : postLostId (int)
Responses : 
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "title": "강아지를 잃어버렸습니다",
    "dogName": "멍멍이",
    "dogType": "MALTESE",
    "dogColor": "흰색",
    "dogGender": "MALE",
    "dogStatus": "MISSING",
    "content": "어제 공원에서 강아지를 잃어버렸습니다...",
    "lostDate": [
      2024,
      1,
      1
    ],
    "lostTime": [
      2024,
      1,
      1,
      14,
      30,
      0,
      0
    ],
    "longitude": 127.0276,
    "latitude": 37.4979,
    "realImages": [
      "https://s3.amazonaws.com/bucket/presigned-url-example1",
      "https://s3.amazonaws.com/bucket/presigned-url-example2"
    ],
    "authorId": 1,
    "authorName": "홍길동",
    "createdAt": [
      2024,
      1,
      1,
      12,
      0,
      0,
      0
    ],
    "timeAgo": "2시간 전"
  }
}
    
    5. /api/lost/posts/{postLostId} (DELETE) 잃어버렸어요 게시글 삭제
Parameters : postLostId
Responses :
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": null
}

    6. /api/lost-posts/{postLostId} (PATCH) 잃어버렸어요 게시글 수정
작성 예시 : 
{
  "title": "강아지를 잃어버렸습니다",
  "dogName": "멍멍이",
  "dogType": "골든 리트리버",
  "dogColor": "갈색",
  "dogGender": "FEMALE",
  "features": "귀여운 목걸이",
  "lostDate": [2024, 1, 1],
  "lostTime": [2024, 1, 1, 14, 30, 0, 0],
  "lostLongitude": 127.0276,
  "lostLatitude": 37.4979,
  "existingImageUrls": ["https://s3.amazonaws.com/bucket/presigned-url1"],
  "deletedImageUrls": ["https://s3.amazonaws.com/bucket/presigned-url2"]
}
Parameters : postLostId
Request : 작성예시의 data(string)와 images(array)
Responses : 
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "memberName": "홍길동",
    "postTitle": "수정된 제목",
    "postDate": [
      2024,
      1,
      1,
      13,
      0,
      0,
      0
    ],
    "dogStatus": "MISSING"
  }
}

    7. /api/lost-posts/{postLostId}/status (PATCH) 잃어버렸어요 게시글 상태 업데이트
요청 예시 : (가능한 상태값 : MISSING (실종), SIGHTED (목격), RETURNED (귀가 완료)
{ "dogStatus": "RETURNED" }
Parameters : postLostId
Request : { "dogStatus": "RETURNED" }
Responses :
코드 200
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "dogStatus": "RETURNED",
    "updatedAt": [
      2024,
      1,
      1,
      15,
      30,
      0,
      0
    ]
  }
}
코드 401
{
  "isSuccess": false,
  "code": "UNAUTHORIZED",
  "message": "인증이 필요합니다",
  "result": null
}
코드 404
{
  "isSuccess": false,
  "code": "POST_NOT_FOUND",
  "message": "게시글을 찾을 수 없습니다",
  "result": null
}

    8. /api/lost-posts/my-posts (GET) 내 잃어버렸어요 게시글 조회 (마이페이지에서 조회하는 부분)
Parameters : page (int, 페이지 번호, default value : 0) , size (int, 페이지 크기, default value : 20)
Responses :
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "posts": [
      {
        "id": 1,
        "title": "강아지를 잃어버렸습니다",
        "dogType": "MALTESE",
        "dogColor": "흰색",
        "location": "TODO: 행정동/구 단위 위치 정보",
        "lostDateTime": [
          2024,
          1,
          1,
          14,
          30,
          0,
          0
        ],
        "image": "https://example.com/image1.jpg",
        "type": "LOST",
        "status": "상태"
      }
    ],
    "hasNext": false
  }
}

발견했어요 게시물 관련 API
1.	/api/found-posts (GET) 발견했어요 게시글 목록 조회
Parameters : page (int, 페이지 번호, default = 0 ) size (int, 페이지 크기, default : 20)
Responses : 
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "content": [
      {
        "id": 1,
        "title": "강아지를 목격했습니다",
        "dogType": "말티즈",
        "dogColor": "흰색",
        "location": "TODO: 행정동/구 단위 위치 정보",
        "foundDateTime": [
          2024,
          1,
          1,
          14,
          30,
          0,
          0
        ],
        "image": "https://s3.amazonaws.com/bucket/presigned-url-example",
        "status": "MISSING"
      },
      {
        "id": 2,
        "title": "골든 리트리버를 목격했습니다",
        "dogType": "골든 리트리버",
        "dogColor": "갈색",
        "location": "TODO: 행정동/구 단위 위치 정보",
        "foundDateTime": [
          2024,
          1,
          1,
          13,
          0,
          0,
          0
        ],
        "image": "https://s3.amazonaws.com/bucket/presigned-url-example2",
        "status": "SIGHTED"
      }
    ],
    "hasNext": true
  }
}

2.	/api/found-posts (POST) 발견했어요 게시글 작성
Multipart/form-data 형식으로 data(json)와 images(이미지 파일) 전송
작성 예시 (data) :
{ "title": "강아지를 주웠습니다", "dogType": "말티즈", "dogColor": "흰색", "dogGender": "MALE", "features": "목걸이가 있었습니다", "foundDate": [2024, 1, 1], "foundTime": [2024, 1, 1, 14, 30, 0, 0], "foundLongitude": 127.0276, "foundLatitude": 37.4979 }
Parameters : data (string0, images (array)
Responses :
코드 200
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "memberName": "홍길동",
    "postTitle": "강아지를 주웠습니다",
    "postDate": [
      2024,
      1,
      1,
      12,
      0,
      0,
      0
    ],
    "dogStatus": "MISSING"
  }
}
코드 400
{
  "isSuccess": false,
  "code": "VALIDATION_ERROR",
  "message": "입력값이 올바르지 않습니다",
  "result": null
}
코드 401
{
  "isSuccess": false,
  "code": "UNAUTHORIZED",
  "message": "인증이 필요합니다",
  "result": null
}
코드 404
{
  "isSuccess": false,
  "code": "DOG_TYPE_NOT_FOUND",
  "message": "존재하지 않는 견종입니다",
  "result": null
}

3.	/api/found-posts/{postFoundId}/reports (POST) 발견했어요 게시글 신고
Parameters : postFoundId
Request : 
{
  "reportType": "FAKE",
  "reportContent": "string"
}
Responses : 
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "createdAt": "2024-01-01T12:00:00"
  }
}

4.	/api/found-posts/{postFoundId} (GET) 발견했어요 게시글 상세 조회
Parameters : postFoundId 
Responses : 
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "title": "강아지를 주웠습니다",
    "dogType": "MALTESE",
    "dogColor": "흰색",
    "dogGender": "MALE",
    "dogStatus": "MISSING",
    "content": "어제 공원에서 강아지를 주웠습니다...",
    "foundDate": [
      2024,
      1,
      1
    ],
    "foundTime": [
      2024,
      1,
      1,
      14,
      30,
      0,
      0
    ],
    "longitude": 127.0276,
    "latitude": 37.4979,
    "realImages": [
      "https://s3.amazonaws.com/bucket/presigned-url-example1",
      "https://s3.amazonaws.com/bucket/presigned-url-example2"
    ],
    "authorId": 1,
    "authorName": "홍길동",
    "createdAt": [
      2024,
      1,
      1,
      12,
      0,
      0,
      0
    ],
    "timeAgo": "2시간 전"
  }
}

5.	/api/found-posts/{postFoundId} (DELETE) 발견했어요 게시글 삭제
Parameters : postFoundId
Responses :
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": null
}

6.	/api/found-posts/{postFoundId} (PATCH) 발견했어요 게시글 수정
작성 예시 (data) :
{
  "title": "강아지를 주웠습니다",
  "dogType": "말티즈",
  "dogColor": "흰색",
  "dogGender": "MALE",
  "features": "목걸이가 있었습니다",
  "foundDate": [2024, 1, 1],
  "foundTime": [2024, 1, 1, 14, 30, 0, 0],
  "foundLongitude": 127.0276,
  "foundLatitude": 37.4979,
  "existingImageUrls": ["https://s3.amazonaws.com/bucket/presigned-url1"],
  "deletedImageUrls": ["https://s3.amazonaws.com/bucket/presigned-url2"]
}
Parameters : postFoundId
Request : data(string), images(array)
Responses : 
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "memberName": "홍길동",
    "postTitle": "수정된 제목",
    "postDate": [
      2024,
      1,
      1,
      13,
      0,
      0,
      0
    ],
    "dogStatus": "MISSING"
  }
}

7.	/api/found-posts/{postFoundId}/status (PATCH) 발견했어요 게시글 강아지 상태 업데이트
요청 예시 : { "dogStatus": "RETURNED" }
Parameters : postFoundId
Request : 
{
  "dogStatus": "RETURNED"
}
Responses :
코드 200
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "postId": 1,
    "dogStatus": "RETURNED",
    "updatedAt": [
      2024,
      1,
      1,
      15,
      30,
      0,
      0
    ]
  }
}
코드 401
{
  "isSuccess": false,
  "code": "UNAUTHORIZED",
  "message": "인증이 필요합니다",
  "result": null
}
코드 404
{
  "isSuccess": false,
  "code": "POST_NOT_FOUND",
  "message": "게시글을 찾을 수 없습니다",
  "result": null
}

8.	/api/found-posts/my-posts (GET) 내 발견했어요 게시글 조회 (마이페이지에서 사용함)
Parameters : page (int, 페이지 번호, default=0), size (int, 페이지 크기, default=20)
Responses :
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "posts": [
      {
        "id": 1,
        "title": "강아지를 목격했습니다",
        "dogType": "MALTESE",
        "dogColor": "흰색",
        "location": "TODO: 행정동/구 단위 위치 정보",
        "lostDateTime": [
          2024,
          1,
          1,
          14,
          30,
          0,
          0
        ],
        "image": "https://example.com/image1.jpg",
        "type": "FOUND",
        "status": "상태"
      }
    ],
    "hasNext": false
  }
}


마이페이지에서 사용자명 표시용으로 사용되는 API
/api/users/profiles (GET)
Responses : 
코드200
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "SUCCESS!",
  "result": {
    "memberId": 1,
    "username": "홍길동",
    "email": "hong@example.com"
  }
}
코드 401
{
  "isSuccess": false,
  "code": "AUTH401",
  "message": "인증이 필요합니다",
  "result": null
}
코드 404
{
  "isSuccess": false,
  "code": "MEMBER404",
  "message": "회원을 찾을 수 없습니다",
  "result": null
}

게시물 작성 때 견종 자동완성 API 
/api/dog-types/search (GET) : 입력된 키워드가 포함된 견종 검색, 최소 2글자 이상 입력해야하며 키워드가 포함된 전체 견종명을 반환함.
Parameters : keyword (string, example: 말티)
Responses : 
코드 200 
[
  "말티즈"
]
코드 400
[]

/api/dog-types/all (GET) : db에 저장된 전체 견종 목록 반환
Responses :
[
  "골든 리트리버",
  "래브라도 리트리버",
  "말티즈",
  "말라뮤트",
  "불독",
  "치와와",
  "푸들",
  "허스키",
  "요크셔테리어",
  "비글"
]
