지금까지 된 것
- 가구 추가 및 이동 기능 데모
- 가구 파일을 로드하고, 로드시 GPU에 보내야하는 정보들 생성 (loadFurniture.ts - createBufferData)

해야하는 것
- GPU에 전달된 정보를 Buffer에 추가하기 위한 전처리
- 버퍼별 struct 패딩 고려해서 설계
- 버퍼별 섹션 나누고 헤더 추가
- bindGroup으로 전달할 요소들 확정 및 설계



loadFurniture.ts를 제외하고는 코드 아직... 더럽습니다...!!!! (feat. GPT...)
