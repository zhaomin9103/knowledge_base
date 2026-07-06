export interface User {
  id: string
  name: string
  /** 角色：student 学生 / teacher 教师 / admin 管理员 */
  type: "student" | "teacher" | "admin"
  /** 组织：院系/部门 */
  organization: string
  /** 工号（teacher/admin）或 学号（student） */
  idNo: string
  avatar?: string
}

/** Mock 用户池（演示用） */
export const MOCK_USERS: User[] = [
  {
    id: "u-admin-001",
    name: "admin",
    type: "admin",
    organization: "信息化办公室",
    idNo: "A20180001",
  },
  {
    id: "u-teacher-001",
    name: "李明",
    type: "teacher",
    organization: "计算机与信息学院",
    idNo: "T20190101",
  },
  {
    id: "u-teacher-002",
    name: "王芳",
    type: "teacher",
    organization: "计算机与信息学院",
    idNo: "T20200215",
  },
  {
    id: "u-teacher-003",
    name: "张强",
    type: "teacher",
    organization: "学生工作处",
    idNo: "T20180520",
  },
  {
    id: "u-teacher-004",
    name: "刘洋",
    type: "teacher",
    organization: "教务处",
    idNo: "T20210808",
  },
  {
    id: "u-teacher-005",
    name: "张三",
    type: "teacher",
    organization: "学生工作处",
    idNo: "T20200301",
  },
  {
    id: "u-teacher-006",
    name: "李四",
    type: "teacher",
    organization: "计算机与信息学院",
    idNo: "T20190405",
  },
  {
    id: "u-teacher-007",
    name: "王五",
    type: "teacher",
    organization: "教务处",
    idNo: "T20210615",
  },
  {
    id: "u-teacher-008",
    name: "赵六",
    type: "teacher",
    organization: "学生工作处",
    idNo: "T20180920",
  },
  {
    id: "u-teacher-009",
    name: "孙七",
    type: "teacher",
    organization: "计算机与信息学院",
    idNo: "T20220112",
  },
  {
    id: "u-teacher-010",
    name: "周八",
    type: "teacher",
    organization: "教务处",
    idNo: "T20190728",
  },
  {
    id: "u-teacher-011",
    name: "吴九",
    type: "teacher",
    organization: "学生工作处",
    idNo: "T20210305",
  },
  {
    id: "u-teacher-012",
    name: "郑十",
    type: "teacher",
    organization: "计算机与信息学院",
    idNo: "T20200918",
  },
  {
    id: "u-teacher-013",
    name: "陈文静",
    type: "teacher",
    organization: "教务处",
    idNo: "T20190520",
  },
  {
    id: "u-teacher-014",
    name: "林志强",
    type: "teacher",
    organization: "学生工作处",
    idNo: "T20210808",
  },
  {
    id: "u-teacher-015",
    name: "黄丽娜",
    type: "teacher",
    organization: "计算机与信息学院",
    idNo: "T20180315",
  },
  {
    id: "u-student-001",
    name: "陈小明",
    type: "student",
    organization: "计算机与信息学院",
    idNo: "2023213105",
  },
  {
    id: "u-student-002",
    name: "刘思雨",
    type: "student",
    organization: "计算机与信息学院",
    idNo: "2023213201",
  },
  {
    id: "u-student-003",
    name: "张伟",
    type: "student",
    organization: "学生工作处",
    idNo: "2022210315",
  },
]

/** 当前登录用户（演示时可切换） */
export let CURRENT_USER: User = MOCK_USERS[0] // 默认 admin

/** 切换当前用户（演示用） */
export function setCurrentUser(userId: string) {
  const user = MOCK_USERS.find((u) => u.id === userId)
  if (user) CURRENT_USER = user
}
