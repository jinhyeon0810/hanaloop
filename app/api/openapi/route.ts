import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(openApiSpec);
}

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Hanaloop PCF API",
    version: "0.1.0",
    description:
      "CT-045 제품 단위 탄소 발자국(PCF) 대시보드의 REST API. 모든 응답은 `{ success, data, message }` 엔벨로프 형식입니다.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "activities", description: "활동 데이터 조회·생성·일괄 임포트" },
    { name: "factors", description: "배출계수 조회" },
  ],
  paths: {
    "/api/activities": {
      get: {
        tags: ["activities"],
        summary: "활동 목록 조회",
        description:
          "기간 및 활동 유형 필터로 활동을 조회합니다. 각 활동의 `emissionsKgco2e`는 `factor.value × quantity`로 계산됩니다.",
        parameters: [
          {
            name: "period",
            in: "query",
            description: "조회 기간 (기본 ytd)",
            required: false,
            schema: { type: "string", enum: ["q1", "q2", "q3", "ytd"] },
          },
          {
            name: "type",
            in: "query",
            description: "활동 유형 필터",
            required: false,
            schema: { $ref: "#/components/schemas/ActivityType" },
          },
        ],
        responses: {
          200: {
            description: "조회 성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            period: { type: "string", example: "ytd" },
                            type: {
                              nullable: true,
                              allOf: [{ $ref: "#/components/schemas/ActivityType" }],
                            },
                            activities: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Activity" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["activities"],
        summary: "활동 다건 생성",
        description:
          "한 번에 여러 활동을 생성합니다. 모든 행이 유효하고 계수가 매칭돼야 일괄 저장됩니다. 한 행이라도 실패하면 전체 거부 + 행별 에러를 `errors` 필드에 반환.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rows"],
                properties: {
                  rows: {
                    type: "array",
                    minItems: 1,
                    items: { $ref: "#/components/schemas/ActivityInput" },
                  },
                },
              },
              examples: {
                single: {
                  summary: "단일 활동",
                  value: {
                    rows: [
                      {
                        date: "2025-09-01",
                        activityType: "electricity",
                        description: "한국전력",
                        quantity: "1000",
                      },
                    ],
                  },
                },
                multiple: {
                  summary: "여러 활동",
                  value: {
                    rows: [
                      {
                        date: "2025-09-01",
                        activityType: "electricity",
                        description: "한국전력",
                        quantity: "1000",
                      },
                      {
                        date: "2025-09-02",
                        activityType: "raw_material",
                        description: "플라스틱 1",
                        quantity: "500",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "생성 성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            created: { type: "integer", example: 2 },
                          },
                        },
                        message: { type: "string", example: "2건이 추가되었습니다." },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "검증 실패 또는 계수 매칭 실패",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ErrorEnvelope" },
                    {
                      type: "object",
                      properties: {
                        errors: {
                          type: "array",
                          items: { $ref: "#/components/schemas/RowError" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/api/activities/import": {
      post: {
        tags: ["activities"],
        summary: "Excel/CSV 일괄 임포트",
        description:
          ".xlsx 또는 .csv 파일을 업로드해 활동을 일괄 등록합니다. 행 단위 검증 후 Accepted/Rejected로 분류되며 부분 성공이 가능합니다.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      ".xlsx 또는 .csv (UTF-8, 10MB 이하). 첫 행은 헤더: 일자/활동 유형/설명/량/단위",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "처리 완료 (행 단위 부분 성공 포함)",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            fileName: { type: "string", example: "활동.xlsx" },
                            accepted: {
                              type: "array",
                              items: { $ref: "#/components/schemas/ImportRow" },
                            },
                            rejected: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  rowNumber: { type: "integer", example: 5 },
                                  reason: {
                                    type: "string",
                                    example: "량이 유효하지 않습니다: '-10'",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "파일 자체 오류 (확장자/크기/헤더 누락 등)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorEnvelope" },
              },
            },
          },
        },
      },
    },
    "/api/factors": {
      get: {
        tags: ["factors"],
        summary: "배출계수 목록 조회",
        parameters: [
          {
            name: "type",
            in: "query",
            description: "활동 유형 필터",
            required: false,
            schema: { $ref: "#/components/schemas/ActivityType" },
          },
        ],
        responses: {
          200: {
            description: "조회 성공",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            factors: {
                              type: "array",
                              items: { $ref: "#/components/schemas/Factor" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "잘못된 활동 유형",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorEnvelope" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SuccessEnvelope: {
        type: "object",
        required: ["success", "data", "message"],
        properties: {
          success: { type: "boolean", enum: [true] },
          data: { type: "object" },
          message: { type: "string", nullable: true, example: "조회 성공" },
        },
      },
      ErrorEnvelope: {
        type: "object",
        required: ["success", "data", "message"],
        properties: {
          success: { type: "boolean", enum: [false] },
          data: { type: "null" },
          message: { type: "string", example: "유효하지 않은 요청입니다." },
          errors: {
            type: "array",
            items: {},
            description: "행 단위·필드 단위 상세 에러 (선택)",
          },
        },
      },
      ActivityType: {
        type: "string",
        enum: ["electricity", "raw_material", "transport"],
      },
      Factor: {
        type: "object",
        properties: {
          id: { type: "string" },
          activityType: { $ref: "#/components/schemas/ActivityType" },
          subCategory: { type: "string", example: "한국전력" },
          value: { type: "number", example: 0.456 },
          unit: { type: "string", example: "kgCO2e/kWh" },
          validFrom: { type: "string", format: "date", example: "2025-01-01" },
          source: { type: "string" },
        },
      },
      Activity: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", format: "date", example: "2025-01-05" },
          activityType: { $ref: "#/components/schemas/ActivityType" },
          description: { type: "string", example: "한국전력" },
          quantity: { type: "number", example: 12000 },
          unit: { type: "string", example: "kWh" },
          factor: {
            type: "object",
            properties: {
              id: { type: "string" },
              value: { type: "number", example: 0.456 },
              source: { type: "string" },
            },
          },
          emissionsKgco2e: { type: "number", example: 5472 },
        },
      },
      ActivityInput: {
        type: "object",
        required: ["date", "activityType", "description", "quantity"],
        properties: {
          date: { type: "string", format: "date", example: "2025-09-01" },
          activityType: { $ref: "#/components/schemas/ActivityType" },
          description: {
            type: "string",
            example: "한국전력",
            description: "등록된 배출계수의 sub_category와 정확히 일치",
          },
          quantity: {
            oneOf: [{ type: "string" }, { type: "number" }],
            example: "1000",
          },
        },
      },
      ImportRow: {
        type: "object",
        properties: {
          rowNumber: { type: "integer", example: 2 },
          date: { type: "string", format: "date" },
          activityType: { type: "string" },
          description: { type: "string" },
          quantity: { type: "string" },
          unit: { type: "string" },
        },
      },
      RowError: {
        type: "object",
        properties: {
          index: { type: "integer", example: 0 },
          field: {
            type: "string",
            enum: ["date", "activityType", "description", "quantity"],
            nullable: true,
          },
          message: { type: "string", example: "량은 0보다 큰 숫자여야 합니다." },
        },
      },
    },
  },
};
