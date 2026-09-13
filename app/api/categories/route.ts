import { NextResponse } from "next/server";
import { categories } from "@/lib/utils";
export const GET = () => NextResponse.json(categories);
