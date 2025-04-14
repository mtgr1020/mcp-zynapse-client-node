import { ApiResponse } from "@/types/api";

export class ResponseUtil {
  static success<T>(data?: T, message: string = "操作成功"): ApiResponse<T> {
    return {
      code: 200,
      message,
      data,
    };
  }

  static error(
    message: string = "操作失败",
    code: number = 500
  ): ApiResponse<null> {
    return {
      code,
      message,
    };
  }
}
