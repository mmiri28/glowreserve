export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "customer" | "business_owner" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "business_owner" | "admin";
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "business_owner" | "admin";
        };
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string | null;
          cover_image_url: string | null;
          logo_url: string | null;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          is_verified: boolean;
          rating: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["businesses"]["Row"],
          "id" | "created_at" | "updated_at" | "rating" | "total_reviews"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["businesses"]["Row"],
            "id" | "owner_id" | "created_at"
          >
        >;
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["services"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "business_id" | "created_at">
        >;
      };
      slots: {
        Row: {
          id: string;
          business_id: string;
          staff_id: string | null;
          slot_datetime: string;
          duration_minutes: number;
          status: "free" | "hold" | "reserved" | "blocked";
          hold_expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["slots"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Omit<Database["public"]["Tables"]["slots"]["Row"], "id" | "created_at">
        >;
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string | null;
          business_id: string;
          service_id: string | null;
          staff_id: string | null;
          slot_id: string | null;
          slot_datetime: string;
          status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
          notes: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["bookings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at">
        >;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string | null;
          business_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["reviews"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at" | "is_read"
        >;
        Update: { is_read?: boolean };
      };
      staff: {
        Row: {
          id: string;
          business_id: string;
          profile_id: string | null;
          name: string;
          avatar_url: string | null;
          specialties: string[] | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["staff"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Omit<Database["public"]["Tables"]["staff"]["Row"], "id" | "created_at">
        >;
      };
      availability_templates: {
        Row: {
          id: string;
          business_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["availability_templates"]["Row"], "id">;
        Update: Partial<
          Omit<Database["public"]["Tables"]["availability_templates"]["Row"], "id" | "business_id">
        >;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Slot = Database["public"]["Tables"]["slots"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Staff = Database["public"]["Tables"]["staff"]["Row"];
export type AvailabilityTemplate = Database["public"]["Tables"]["availability_templates"]["Row"];
