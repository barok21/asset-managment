// type User = {
//   name: string;
//   email: string;
//   image?: string;
//   accountId: string;
// };

enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

const UoM = [
  { label: "Piece (pc)", value: "pc" },
  { label: "Set", value: "set" },
  { label: "Box", value: "box" },
  { label: "Package (pkg)", value: "pkg" },
  { label: "Roll", value: "roll" },
  { label: "Pair", value: "pair" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Gram (g)", value: "g" },
  { label: "Liter (l)", value: "l" },
  { label: "Milliliter (ml)", value: "ml" },
  { label: "Meter (m)", value: "m" },
  { label: "Centimeter (cm)", value: "cm" },
  { label: "Foot (ft)", value: "ft" },
  { label: "Square Meter (sqm)", value: "sqm" },
  { label: "Cubic Meter (cbm)", value: "cbm" },
];

type Property = Models.DocumentList<Models.Document> & {
  $id: string;
  name: string;
  quantity: number;
  initial_price: number;
  category: string;
};

interface CreateProperty {
  name: string;
  quantity: number;
  initial_price: number;
  category: string;
  dept_user: string;
  UoM: string;
}

interface CreateDept {
  name: string;
  dept_id: string;
}

interface requestProperty {
  requestor_full_name:string,
  department: string,
  property_name: string,
  quantity: string,
  special_requirment?: string,
  request_batch_id: string
}

interface GetAllProperties {
  limit?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  category?: string | string[];
  dept_user?: string | string[];
}

interface GetAllDepartment {
  limit?: number;
  page?: number;
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
}
