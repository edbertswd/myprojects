--
-- PostgreSQL database dump
--

\restrict dR0F3gVxFixJQU6LHEXMeW6h9uGHbD60JcTIhXMg4LBahpWEyUataE05AKMuetM

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_user_id_79052e9e_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.users_user_permissions DROP CONSTRAINT IF EXISTS users_user_permissions_user_id_92473840_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.users_user_permissions DROP CONSTRAINT IF EXISTS users_user_permissio_permission_id_6d08dcd2_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.users_groups DROP CONSTRAINT IF EXISTS users_groups_user_id_f500bee5_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.users_groups DROP CONSTRAINT IF EXISTS users_groups_group_id_2f3517aa_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.temporary_reservations DROP CONSTRAINT IF EXISTS temporary_reservations_user_id_56c45644_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_05e26f4a_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.reservation_slots DROP CONSTRAINT IF EXISTS reservation_slots_reservation_id_1229c9c9_fk_temporary;
ALTER TABLE IF EXISTS ONLY public.reservation_slots DROP CONSTRAINT IF EXISTS reservation_slots_availability_id_f812bc67_fk_availabil;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_resolved_by_id_6fe4a539_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_reporter_user_id_df302b5f_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_assigned_to_id_ccc64888_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.refund_requests DROP CONSTRAINT IF EXISTS refund_requests_reviewed_by_id_81a63f8b_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.refund_requests DROP CONSTRAINT IF EXISTS refund_requests_requested_by_id_ca20554a_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.refund_requests DROP CONSTRAINT IF EXISTS refund_requests_booking_id_35516ca9_fk_bookings_booking_id;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_status_id_59e5077a_fk_payment_status_status_id;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_id_83b27e37_fk_payment_m;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_booking_id_fa2b6c3e_fk_bookings_booking_id;
ALTER TABLE IF EXISTS ONLY public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_d4fe6d88_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.manager DROP CONSTRAINT IF EXISTS manager_user_id_03d26107_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.manager_suspensions DROP CONSTRAINT IF EXISTS manager_suspensions_unsuspended_by_id_841696da_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.manager_suspensions DROP CONSTRAINT IF EXISTS manager_suspensions_suspended_by_id_b1abc585_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.manager_suspensions DROP CONSTRAINT IF EXISTS manager_suspensions_manager_id_e9418177_fk_manager_user_id;
ALTER TABLE IF EXISTS ONLY public.manager_requests DROP CONSTRAINT IF EXISTS manager_requests_user_id_97fb6b1a_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.manager_requests DROP CONSTRAINT IF EXISTS manager_requests_admin_user_id_994e43de_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.manager_request_sport_types DROP CONSTRAINT IF EXISTS manager_request_spor_sport_type_id_6d1d14f3_fk_sport_typ;
ALTER TABLE IF EXISTS ONLY public.manager_request_sport_types DROP CONSTRAINT IF EXISTS manager_request_spor_request_id_47a5035c_fk_manager_r;
ALTER TABLE IF EXISTS ONLY public.facility_suspensions DROP CONSTRAINT IF EXISTS facility_suspensions_unsuspended_by_id_fd550bd5_fk_users_use;
ALTER TABLE IF EXISTS ONLY public.facility_suspensions DROP CONSTRAINT IF EXISTS facility_suspensions_suspended_by_id_57c19fc5_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.facility_suspensions DROP CONSTRAINT IF EXISTS facility_suspensions_facility_id_9a9a226f_fk_facilitie;
ALTER TABLE IF EXISTS ONLY public.facility_reviews DROP CONSTRAINT IF EXISTS facility_reviews_user_id_f89492a3_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.facility_reviews DROP CONSTRAINT IF EXISTS facility_reviews_facility_id_d928644a_fk_facilities_facility_id;
ALTER TABLE IF EXISTS ONLY public.facility_reviews DROP CONSTRAINT IF EXISTS facility_reviews_booking_id_4cbeb72f_fk_bookings_booking_id;
ALTER TABLE IF EXISTS ONLY public.facility_requests DROP CONSTRAINT IF EXISTS facility_requests_submitted_by_id_3a70f2c4_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.facility_requests DROP CONSTRAINT IF EXISTS facility_requests_approved_facility_id_868e8b7e_fk_facilitie;
ALTER TABLE IF EXISTS ONLY public.facility_requests DROP CONSTRAINT IF EXISTS facility_requests_admin_user_id_b25a1074_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.facility_request_sport_types DROP CONSTRAINT IF EXISTS facility_request_spo_sport_type_id_c05a3569_fk_sport_typ;
ALTER TABLE IF EXISTS ONLY public.facility_request_sport_types DROP CONSTRAINT IF EXISTS facility_request_spo_request_id_d991b34d_fk_facility_;
ALTER TABLE IF EXISTS ONLY public.facilities DROP CONSTRAINT IF EXISTS facilities_submitted_by_id_e320394e_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.facilities DROP CONSTRAINT IF EXISTS facilities_manager_id_b649f479_fk_manager_user_id;
ALTER TABLE IF EXISTS ONLY public.facilities DROP CONSTRAINT IF EXISTS facilities_approved_by_id_73c63151_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.courts DROP CONSTRAINT IF EXISTS courts_sport_type_id_71beb06e_fk_sport_types_sport_type_id;
ALTER TABLE IF EXISTS ONLY public.courts DROP CONSTRAINT IF EXISTS courts_facility_id_7f65d61e_fk_facilities_facility_id;
ALTER TABLE IF EXISTS ONLY public.commission_adjustments DROP CONSTRAINT IF EXISTS commission_adjustments_adjusted_by_id_0526579b_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.commission_adjustments DROP CONSTRAINT IF EXISTS commission_adjustmen_facility_id_8e8ab493_fk_facilitie;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_6e734b08_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_status_id_40170da9_fk_booking_status_status_id;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_court_id_d5212cde_fk_courts_court_id;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_availability_id_ef838b85_fk_availabil;
ALTER TABLE IF EXISTS ONLY public.availabilities DROP CONSTRAINT IF EXISTS availabilities_court_id_3cc4edac_fk_courts_court_id;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_otp_codes DROP CONSTRAINT IF EXISTS auth_otp_codes_user_id_0a9070ce_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.admin_action_log DROP CONSTRAINT IF EXISTS admin_action_log_target_user_id_3f9286fd_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.admin_action_log DROP CONSTRAINT IF EXISTS admin_action_log_admin_user_id_e4e2a3cd_fk_users_user_id;
ALTER TABLE IF EXISTS ONLY public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_f1e09264_fk_users_user_id;
DROP INDEX IF EXISTS public.verification_tokens_user_id_79052e9e;
DROP INDEX IF EXISTS public.verification_tokens_token_id_48fce852_like;
DROP INDEX IF EXISTS public.ux_facilities_manager_name_nonnull;
DROP INDEX IF EXISTS public.users_user_permissions_user_id_92473840;
DROP INDEX IF EXISTS public.users_user_permissions_permission_id_6d08dcd2;
DROP INDEX IF EXISTS public.users_groups_user_id_f500bee5;
DROP INDEX IF EXISTS public.users_groups_group_id_2f3517aa;
DROP INDEX IF EXISTS public.users_email_0ea73cca_like;
DROP INDEX IF EXISTS public.temporary_reservations_user_id_56c45644;
DROP INDEX IF EXISTS public.sport_types_sport_name_d7fcf9e5_like;
DROP INDEX IF EXISTS public.sessions_user_id_05e26f4a;
DROP INDEX IF EXISTS public.sessions_session_id_5cb0abd8_like;
DROP INDEX IF EXISTS public.reservation_slots_reservation_id_1229c9c9;
DROP INDEX IF EXISTS public.reservation_slots_availability_id_f812bc67;
DROP INDEX IF EXISTS public.reports_resolved_by_id_6fe4a539;
DROP INDEX IF EXISTS public.reports_reporter_user_id_df302b5f;
DROP INDEX IF EXISTS public.reports_assigned_to_id_ccc64888;
DROP INDEX IF EXISTS public.refund_requests_reviewed_by_id_81a63f8b;
DROP INDEX IF EXISTS public.refund_requests_requested_by_id_ca20554a;
DROP INDEX IF EXISTS public.refund_requests_booking_id_35516ca9;
DROP INDEX IF EXISTS public.payments_status_id_59e5077a;
DROP INDEX IF EXISTS public.payments_payment_method_id_83b27e37;
DROP INDEX IF EXISTS public.payments_idempotency_key_b37fd3db_like;
DROP INDEX IF EXISTS public.payments_booking_id_fa2b6c3e;
DROP INDEX IF EXISTS public.payment_status_status_name_86697ad5_like;
DROP INDEX IF EXISTS public.payment_methods_user_id_d4fe6d88;
DROP INDEX IF EXISTS public.manager_suspensions_unsuspended_by_id_841696da;
DROP INDEX IF EXISTS public.manager_suspensions_suspended_by_id_b1abc585;
DROP INDEX IF EXISTS public.manager_suspensions_manager_id_e9418177;
DROP INDEX IF EXISTS public.manager_requests_user_id_97fb6b1a;
DROP INDEX IF EXISTS public.manager_requests_admin_user_id_994e43de;
DROP INDEX IF EXISTS public.manager_request_sport_types_sport_type_id_6d1d14f3;
DROP INDEX IF EXISTS public.manager_request_sport_types_request_id_47a5035c;
DROP INDEX IF EXISTS public.idx_temp_res_user_expires;
DROP INDEX IF EXISTS public.idx_temp_res_expires;
DROP INDEX IF EXISTS public.idx_reviews_user_created;
DROP INDEX IF EXISTS public.idx_reviews_facility_created;
DROP INDEX IF EXISTS public.idx_res_slot_availability;
DROP INDEX IF EXISTS public.idx_reports_status;
DROP INDEX IF EXISTS public.idx_reports_severity;
DROP INDEX IF EXISTS public.idx_reports_resource;
DROP INDEX IF EXISTS public.idx_reports_assigned;
DROP INDEX IF EXISTS public.idx_refund_status;
DROP INDEX IF EXISTS public.idx_refund_requester;
DROP INDEX IF EXISTS public.idx_refund_booking;
DROP INDEX IF EXISTS public.idx_payments_booking;
DROP INDEX IF EXISTS public.idx_payment_methods_user;
DROP INDEX IF EXISTS public.idx_mgr_susp_manager_status;
DROP INDEX IF EXISTS public.idx_mgr_susp_expires;
DROP INDEX IF EXISTS public.idx_mgr_susp_created;
DROP INDEX IF EXISTS public.idx_mgr_req_user;
DROP INDEX IF EXISTS public.idx_manager_suspended;
DROP INDEX IF EXISTS public.idx_facreq_submitter;
DROP INDEX IF EXISTS public.idx_facreq_status;
DROP INDEX IF EXISTS public.idx_facreq_facility_name_addr;
DROP INDEX IF EXISTS public.idx_facilities_latlon;
DROP INDEX IF EXISTS public.idx_fac_susp_facility_status;
DROP INDEX IF EXISTS public.idx_fac_susp_expires;
DROP INDEX IF EXISTS public.idx_fac_susp_created;
DROP INDEX IF EXISTS public.idx_fac_dupe_guard;
DROP INDEX IF EXISTS public.idx_comm_adj_facility;
DROP INDEX IF EXISTS public.idx_comm_adj_admin;
DROP INDEX IF EXISTS public.idx_bookings_user_created_at;
DROP INDEX IF EXISTS public.idx_activity_user_time;
DROP INDEX IF EXISTS public.idx_activity_action;
DROP INDEX IF EXISTS public.facility_suspensions_unsuspended_by_id_fd550bd5;
DROP INDEX IF EXISTS public.facility_suspensions_suspended_by_id_57c19fc5;
DROP INDEX IF EXISTS public.facility_suspensions_facility_id_9a9a226f;
DROP INDEX IF EXISTS public.facility_reviews_user_id_f89492a3;
DROP INDEX IF EXISTS public.facility_reviews_facility_id_d928644a;
DROP INDEX IF EXISTS public.facility_requests_submitted_by_id_3a70f2c4;
DROP INDEX IF EXISTS public.facility_requests_approved_facility_id_868e8b7e;
DROP INDEX IF EXISTS public.facility_requests_admin_user_id_b25a1074;
DROP INDEX IF EXISTS public.facility_request_sport_types_sport_type_id_c05a3569;
DROP INDEX IF EXISTS public.facility_request_sport_types_request_id_d991b34d;
DROP INDEX IF EXISTS public.facilities_submitted_by_id_e320394e;
DROP INDEX IF EXISTS public.facilities_manager_id_b649f479;
DROP INDEX IF EXISTS public.facilities_approved_by_id_73c63151;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.courts_sport_type_id_71beb06e;
DROP INDEX IF EXISTS public.courts_facility_id_7f65d61e;
DROP INDEX IF EXISTS public.commission_adjustments_facility_id_8e8ab493;
DROP INDEX IF EXISTS public.commission_adjustments_adjusted_by_id_0526579b;
DROP INDEX IF EXISTS public.bookings_user_id_6e734b08;
DROP INDEX IF EXISTS public.bookings_status_id_40170da9;
DROP INDEX IF EXISTS public.bookings_court_id_d5212cde;
DROP INDEX IF EXISTS public.booking_status_status_name_ffd40a51_like;
DROP INDEX IF EXISTS public.axes_accesslog_username_df93064b_like;
DROP INDEX IF EXISTS public.axes_accesslog_username_df93064b;
DROP INDEX IF EXISTS public.axes_accesslog_user_agent_0e659004_like;
DROP INDEX IF EXISTS public.axes_accesslog_user_agent_0e659004;
DROP INDEX IF EXISTS public.axes_accesslog_ip_address_86b417e5;
DROP INDEX IF EXISTS public.axes_accessfailurelog_username_a8b7e8a4_like;
DROP INDEX IF EXISTS public.axes_accessfailurelog_username_a8b7e8a4;
DROP INDEX IF EXISTS public.axes_accessfailurelog_user_agent_ea145dda_like;
DROP INDEX IF EXISTS public.axes_accessfailurelog_user_agent_ea145dda;
DROP INDEX IF EXISTS public.axes_accessfailurelog_ip_address_2e9f5a7f;
DROP INDEX IF EXISTS public.axes_accessattempt_username_3f2d4ca0_like;
DROP INDEX IF EXISTS public.axes_accessattempt_username_3f2d4ca0;
DROP INDEX IF EXISTS public.axes_accessattempt_user_agent_ad89678b_like;
DROP INDEX IF EXISTS public.axes_accessattempt_user_agent_ad89678b;
DROP INDEX IF EXISTS public.axes_accessattempt_ip_address_10922d9c;
DROP INDEX IF EXISTS public.availabilities_court_id_3cc4edac;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_otp_codes_user_id_0a9070ce;
DROP INDEX IF EXISTS public.auth_otp_co_user_id_4942d0_idx;
DROP INDEX IF EXISTS public.auth_otp_co_code_366bfc_idx;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
DROP INDEX IF EXISTS public.admin_action_log_target_user_id_3f9286fd;
DROP INDEX IF EXISTS public.admin_action_log_admin_user_id_e4e2a3cd;
DROP INDEX IF EXISTS public.activity_log_user_id_f1e09264;
ALTER TABLE IF EXISTS ONLY public.verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.manager_requests DROP CONSTRAINT IF EXISTS ux_mgr_req_user_facility_key;
ALTER TABLE IF EXISTS ONLY public.facility_requests DROP CONSTRAINT IF EXISTS ux_facreq_submitter_facility_key;
ALTER TABLE IF EXISTS ONLY public.users_user_permissions DROP CONSTRAINT IF EXISTS users_user_permissions_user_id_permission_id_3b86cbdf_uniq;
ALTER TABLE IF EXISTS ONLY public.users_user_permissions DROP CONSTRAINT IF EXISTS users_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users_groups DROP CONSTRAINT IF EXISTS users_groups_user_id_group_id_fc7788e8_uniq;
ALTER TABLE IF EXISTS ONLY public.users_groups DROP CONSTRAINT IF EXISTS users_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.facility_reviews DROP CONSTRAINT IF EXISTS unique_user_booking_review;
ALTER TABLE IF EXISTS ONLY public.manager_request_sport_types DROP CONSTRAINT IF EXISTS unique_request_sport_type;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS unique_provider_payment;
ALTER TABLE IF EXISTS ONLY public.facility_request_sport_types DROP CONSTRAINT IF EXISTS unique_facility_request_sport_type;
ALTER TABLE IF EXISTS ONLY public.availabilities DROP CONSTRAINT IF EXISTS unique_court_start_time;
ALTER TABLE IF EXISTS ONLY public.courts DROP CONSTRAINT IF EXISTS unique_court_per_facility;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS unique_court_booking_time;
ALTER TABLE IF EXISTS ONLY public.availabilities DROP CONSTRAINT IF EXISTS unique_availability_composite;
ALTER TABLE IF EXISTS ONLY public.temporary_reservations DROP CONSTRAINT IF EXISTS temporary_reservations_pkey;
ALTER TABLE IF EXISTS ONLY public.sport_types DROP CONSTRAINT IF EXISTS sport_types_sport_name_key;
ALTER TABLE IF EXISTS ONLY public.sport_types DROP CONSTRAINT IF EXISTS sport_types_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.reservation_slots DROP CONSTRAINT IF EXISTS reservation_slots_reservation_id_availability_id_507e1a21_uniq;
ALTER TABLE IF EXISTS ONLY public.reservation_slots DROP CONSTRAINT IF EXISTS reservation_slots_pkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
ALTER TABLE IF EXISTS ONLY public.refund_requests DROP CONSTRAINT IF EXISTS refund_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_idempotency_key_key;
ALTER TABLE IF EXISTS ONLY public.payment_status DROP CONSTRAINT IF EXISTS payment_status_status_name_key;
ALTER TABLE IF EXISTS ONLY public.payment_status DROP CONSTRAINT IF EXISTS payment_status_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_pkey;
ALTER TABLE IF EXISTS ONLY public.manager_suspensions DROP CONSTRAINT IF EXISTS manager_suspensions_pkey;
ALTER TABLE IF EXISTS ONLY public.manager_requests DROP CONSTRAINT IF EXISTS manager_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.manager_request_sport_types DROP CONSTRAINT IF EXISTS manager_request_sport_types_pkey;
ALTER TABLE IF EXISTS ONLY public.manager DROP CONSTRAINT IF EXISTS manager_pkey;
ALTER TABLE IF EXISTS ONLY public.facility_suspensions DROP CONSTRAINT IF EXISTS facility_suspensions_pkey;
ALTER TABLE IF EXISTS ONLY public.facility_reviews DROP CONSTRAINT IF EXISTS facility_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.facility_reviews DROP CONSTRAINT IF EXISTS facility_reviews_booking_id_key;
ALTER TABLE IF EXISTS ONLY public.facility_requests DROP CONSTRAINT IF EXISTS facility_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.facility_request_sport_types DROP CONSTRAINT IF EXISTS facility_request_sport_types_pkey;
ALTER TABLE IF EXISTS ONLY public.facilities DROP CONSTRAINT IF EXISTS facilities_pkey;
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.courts DROP CONSTRAINT IF EXISTS courts_pkey;
ALTER TABLE IF EXISTS ONLY public.commission_adjustments DROP CONSTRAINT IF EXISTS commission_adjustments_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_availability_id_key;
ALTER TABLE IF EXISTS ONLY public.booking_status DROP CONSTRAINT IF EXISTS booking_status_status_name_key;
ALTER TABLE IF EXISTS ONLY public.booking_status DROP CONSTRAINT IF EXISTS booking_status_pkey;
ALTER TABLE IF EXISTS ONLY public.axes_accesslog DROP CONSTRAINT IF EXISTS axes_accesslog_pkey;
ALTER TABLE IF EXISTS ONLY public.axes_accessfailurelog DROP CONSTRAINT IF EXISTS axes_accessfailurelog_pkey;
ALTER TABLE IF EXISTS ONLY public.axes_accessattempt DROP CONSTRAINT IF EXISTS axes_accessattempt_username_ip_address_user_agent_8ea22282_uniq;
ALTER TABLE IF EXISTS ONLY public.axes_accessattempt DROP CONSTRAINT IF EXISTS axes_accessattempt_pkey;
ALTER TABLE IF EXISTS ONLY public.availabilities DROP CONSTRAINT IF EXISTS availabilities_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_otp_codes DROP CONSTRAINT IF EXISTS auth_otp_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
ALTER TABLE IF EXISTS ONLY public.admin_action_log DROP CONSTRAINT IF EXISTS admin_action_log_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_log DROP CONSTRAINT IF EXISTS activity_log_pkey;
DROP TABLE IF EXISTS public.verification_tokens;
DROP TABLE IF EXISTS public.users_user_permissions;
DROP TABLE IF EXISTS public.users_groups;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.temporary_reservations;
DROP TABLE IF EXISTS public.sport_types;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.reservation_slots;
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.refund_requests;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.payment_status;
DROP TABLE IF EXISTS public.payment_methods;
DROP TABLE IF EXISTS public.manager_suspensions;
DROP TABLE IF EXISTS public.manager_requests;
DROP TABLE IF EXISTS public.manager_request_sport_types;
DROP TABLE IF EXISTS public.manager;
DROP TABLE IF EXISTS public.facility_suspensions;
DROP TABLE IF EXISTS public.facility_reviews;
DROP TABLE IF EXISTS public.facility_requests;
DROP TABLE IF EXISTS public.facility_request_sport_types;
DROP TABLE IF EXISTS public.facilities;
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_admin_log;
DROP TABLE IF EXISTS public.courts;
DROP TABLE IF EXISTS public.commission_adjustments;
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.booking_status;
DROP TABLE IF EXISTS public.axes_accesslog;
DROP TABLE IF EXISTS public.axes_accessfailurelog;
DROP TABLE IF EXISTS public.axes_accessattempt;
DROP TABLE IF EXISTS public.availabilities;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_otp_codes;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
DROP TABLE IF EXISTS public.admin_action_log;
DROP TABLE IF EXISTS public.activity_log;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_log (
    activity_id bigint NOT NULL,
    action character varying(64) NOT NULL,
    resource_type character varying(50),
    resource_id bigint,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL,
    user_id bigint
);


ALTER TABLE public.activity_log OWNER TO postgres;

--
-- Name: activity_log_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.activity_log ALTER COLUMN activity_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.activity_log_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admin_action_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_action_log (
    action_id bigint NOT NULL,
    action_name character varying(255) NOT NULL,
    resource_type character varying(255) NOT NULL,
    resource_id bigint NOT NULL,
    reason text NOT NULL,
    financial_impact numeric(10,2),
    metadata jsonb,
    created_at timestamp with time zone NOT NULL,
    admin_user_id bigint NOT NULL,
    target_user_id bigint
);


ALTER TABLE public.admin_action_log OWNER TO postgres;

--
-- Name: admin_action_log_action_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_action_log ALTER COLUMN action_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.admin_action_log_action_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_otp_codes (
    id bigint NOT NULL,
    code character varying(6) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean NOT NULL,
    purpose character varying(50) NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.auth_otp_codes OWNER TO postgres;

--
-- Name: auth_otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_otp_codes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_otp_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: availabilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availabilities (
    availability_id bigint NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    is_available boolean NOT NULL,
    court_id bigint NOT NULL
);


ALTER TABLE public.availabilities OWNER TO postgres;

--
-- Name: availabilities_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.availabilities ALTER COLUMN availability_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.availabilities_availability_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: axes_accessattempt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.axes_accessattempt (
    id integer NOT NULL,
    user_agent character varying(255) NOT NULL,
    ip_address inet,
    username character varying(255),
    http_accept character varying(1025) NOT NULL,
    path_info character varying(255) NOT NULL,
    attempt_time timestamp with time zone NOT NULL,
    get_data text NOT NULL,
    post_data text NOT NULL,
    failures_since_start integer NOT NULL,
    CONSTRAINT axes_accessattempt_failures_since_start_check CHECK ((failures_since_start >= 0))
);


ALTER TABLE public.axes_accessattempt OWNER TO postgres;

--
-- Name: axes_accessattempt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.axes_accessattempt ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.axes_accessattempt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: axes_accessfailurelog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.axes_accessfailurelog (
    id integer NOT NULL,
    user_agent character varying(255) NOT NULL,
    ip_address inet,
    username character varying(255),
    http_accept character varying(1025) NOT NULL,
    path_info character varying(255) NOT NULL,
    attempt_time timestamp with time zone NOT NULL,
    locked_out boolean NOT NULL
);


ALTER TABLE public.axes_accessfailurelog OWNER TO postgres;

--
-- Name: axes_accessfailurelog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.axes_accessfailurelog ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.axes_accessfailurelog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: axes_accesslog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.axes_accesslog (
    id integer NOT NULL,
    user_agent character varying(255) NOT NULL,
    ip_address inet,
    username character varying(255),
    http_accept character varying(1025) NOT NULL,
    path_info character varying(255) NOT NULL,
    attempt_time timestamp with time zone NOT NULL,
    logout_time timestamp with time zone,
    session_hash character varying(64) NOT NULL
);


ALTER TABLE public.axes_accesslog OWNER TO postgres;

--
-- Name: axes_accesslog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.axes_accesslog ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.axes_accesslog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: booking_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_status (
    status_id bigint NOT NULL,
    status_name character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.booking_status OWNER TO postgres;

--
-- Name: booking_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.booking_status ALTER COLUMN status_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.booking_status_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    booking_id bigint NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    hourly_rate_snapshot numeric(10,2) NOT NULL,
    commission_rate_snapshot numeric(5,2) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    availability_id bigint NOT NULL,
    court_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status_id bigint NOT NULL
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.bookings ALTER COLUMN booking_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.bookings_booking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: commission_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_adjustments (
    adjustment_id bigint NOT NULL,
    old_rate numeric(5,4) NOT NULL,
    new_rate numeric(5,4) NOT NULL,
    reason text NOT NULL,
    effective_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    metadata jsonb,
    adjusted_by_id bigint NOT NULL,
    facility_id bigint NOT NULL
);


ALTER TABLE public.commission_adjustments OWNER TO postgres;

--
-- Name: commission_adjustments_adjustment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.commission_adjustments ALTER COLUMN adjustment_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.commission_adjustments_adjustment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: courts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courts (
    court_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    facility_id bigint NOT NULL,
    sport_type_id bigint NOT NULL,
    availability_start_date date,
    closing_time time without time zone,
    opening_time time without time zone,
    CONSTRAINT check_hourly_rate_range CHECK (((hourly_rate >= (10)::numeric) AND (hourly_rate <= (200)::numeric)))
);


ALTER TABLE public.courts OWNER TO postgres;

--
-- Name: courts_court_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.courts ALTER COLUMN court_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.courts_court_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id bigint NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- Name: facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facilities (
    facility_id bigint NOT NULL,
    facility_name character varying(255) NOT NULL,
    address character varying(500) NOT NULL,
    timezone character varying(50) NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    approval_status character varying(20) NOT NULL,
    approved_at timestamp with time zone,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    approved_by_id bigint,
    manager_id bigint,
    submitted_by_id bigint,
    commission_rate numeric(5,4) NOT NULL,
    image character varying(100),
    is_suspended boolean NOT NULL
);


ALTER TABLE public.facilities OWNER TO postgres;

--
-- Name: facilities_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.facilities ALTER COLUMN facility_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facilities_facility_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facility_request_sport_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_request_sport_types (
    id bigint NOT NULL,
    request_id bigint NOT NULL,
    sport_type_id bigint NOT NULL
);


ALTER TABLE public.facility_request_sport_types OWNER TO postgres;

--
-- Name: facility_request_sport_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.facility_request_sport_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facility_request_sport_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facility_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_requests (
    request_id bigint NOT NULL,
    status character varying(20) NOT NULL,
    decided_at timestamp with time zone,
    motivation text NOT NULL,
    facility_name character varying(255) NOT NULL,
    facility_address character varying(500) NOT NULL,
    contact_phone character varying(32) NOT NULL,
    proposed_timezone character varying(50) NOT NULL,
    proposed_latitude numeric(9,6),
    proposed_longitude numeric(9,6),
    court_count integer,
    operating_hours jsonb,
    created_at timestamp with time zone NOT NULL,
    admin_user_id bigint,
    approved_facility_id bigint,
    submitted_by_id bigint NOT NULL
);


ALTER TABLE public.facility_requests OWNER TO postgres;

--
-- Name: facility_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.facility_requests ALTER COLUMN request_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facility_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facility_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_reviews (
    review_id bigint NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    booking_id bigint NOT NULL,
    facility_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT check_rating_range CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.facility_reviews OWNER TO postgres;

--
-- Name: facility_reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.facility_reviews ALTER COLUMN review_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facility_reviews_review_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facility_suspensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_suspensions (
    suspension_id bigint NOT NULL,
    reason text NOT NULL,
    duration_days integer,
    status character varying(20) NOT NULL,
    suspended_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone,
    unsuspended_at timestamp with time zone,
    unsuspension_reason text,
    metadata jsonb,
    facility_id bigint NOT NULL,
    suspended_by_id bigint NOT NULL,
    unsuspended_by_id bigint
);


ALTER TABLE public.facility_suspensions OWNER TO postgres;

--
-- Name: facility_suspensions_suspension_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.facility_suspensions ALTER COLUMN suspension_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facility_suspensions_suspension_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: manager; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager (
    user_id bigint NOT NULL,
    payment_account_id character varying(255),
    payment_provider character varying(50),
    payout_verification_status character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_suspended boolean NOT NULL
);


ALTER TABLE public.manager OWNER TO postgres;

--
-- Name: manager_request_sport_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_request_sport_types (
    id bigint NOT NULL,
    request_id bigint NOT NULL,
    sport_type_id bigint NOT NULL
);


ALTER TABLE public.manager_request_sport_types OWNER TO postgres;

--
-- Name: manager_request_sport_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.manager_request_sport_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.manager_request_sport_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: manager_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_requests (
    request_id bigint NOT NULL,
    status character varying(20) NOT NULL,
    decided_at timestamp with time zone,
    reason text NOT NULL,
    facility_name character varying(255) NOT NULL,
    facility_address character varying(500) NOT NULL,
    contact_phone character varying(32) NOT NULL,
    proposed_timezone character varying(50) NOT NULL,
    proposed_latitude numeric(9,6),
    proposed_longitude numeric(9,6),
    court_count integer,
    operating_hours jsonb,
    business_experience text,
    created_at timestamp with time zone NOT NULL,
    admin_user_id bigint,
    user_id bigint NOT NULL
);


ALTER TABLE public.manager_requests OWNER TO postgres;

--
-- Name: manager_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.manager_requests ALTER COLUMN request_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.manager_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: manager_suspensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_suspensions (
    suspension_id bigint NOT NULL,
    reason text NOT NULL,
    duration_days integer,
    status character varying(20) NOT NULL,
    suspended_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone,
    unsuspended_at timestamp with time zone,
    unsuspension_reason text,
    metadata jsonb,
    manager_id bigint NOT NULL,
    suspended_by_id bigint NOT NULL,
    unsuspended_by_id bigint
);


ALTER TABLE public.manager_suspensions OWNER TO postgres;

--
-- Name: manager_suspensions_suspension_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.manager_suspensions ALTER COLUMN suspension_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.manager_suspensions_suspension_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    payment_method_id bigint NOT NULL,
    provider character varying(50) NOT NULL,
    payment_token character varying(255) NOT NULL,
    is_default boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: payment_methods_payment_method_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_methods ALTER COLUMN payment_method_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payment_methods_payment_method_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payment_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_status (
    status_id bigint NOT NULL,
    status_name character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.payment_status OWNER TO postgres;

--
-- Name: payment_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_status ALTER COLUMN status_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payment_status_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id bigint NOT NULL,
    provider character varying(50) NOT NULL,
    provider_payment_id character varying(255) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    booking_id bigint NOT NULL,
    payment_method_id bigint,
    status_id bigint NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ALTER COLUMN payment_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payments_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: refund_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refund_requests (
    request_id bigint NOT NULL,
    reason text NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) NOT NULL,
    review_reason text,
    created_at timestamp with time zone NOT NULL,
    reviewed_at timestamp with time zone,
    processed_at timestamp with time zone,
    refund_transaction_id character varying(255),
    metadata jsonb,
    booking_id bigint NOT NULL,
    requested_by_id bigint NOT NULL,
    reviewed_by_id bigint
);


ALTER TABLE public.refund_requests OWNER TO postgres;

--
-- Name: refund_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.refund_requests ALTER COLUMN request_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.refund_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    report_id bigint NOT NULL,
    resource_type character varying(50) NOT NULL,
    resource_id bigint NOT NULL,
    reason text,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    resolved_at timestamp with time zone,
    resolution_note text,
    reporter_user_id bigint NOT NULL,
    resolved_by_id bigint,
    assigned_to_id bigint,
    category character varying(50) NOT NULL,
    severity character varying(20) NOT NULL
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.reports ALTER COLUMN report_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.reports_report_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reservation_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation_slots (
    reservation_slot_id bigint NOT NULL,
    availability_id bigint NOT NULL,
    reservation_id bigint NOT NULL
);


ALTER TABLE public.reservation_slots OWNER TO postgres;

--
-- Name: reservation_slots_reservation_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.reservation_slots ALTER COLUMN reservation_slot_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.reservation_slots_reservation_slot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    session_id character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    ip_address inet,
    user_agent text,
    revoked_at timestamp with time zone,
    user_id bigint NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sport_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sport_types (
    sport_type_id bigint NOT NULL,
    sport_name character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.sport_types OWNER TO postgres;

--
-- Name: sport_types_sport_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sport_types ALTER COLUMN sport_type_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sport_types_sport_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: temporary_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.temporary_reservations (
    reservation_id bigint NOT NULL,
    session_id character varying(255),
    reserved_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.temporary_reservations OWNER TO postgres;

--
-- Name: temporary_reservations_reservation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.temporary_reservations ALTER COLUMN reservation_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.temporary_reservations_reservation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    user_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(254) NOT NULL,
    phone_number character varying(32),
    verification_status character varying(20) NOT NULL,
    is_admin boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL,
    mfa_enabled boolean NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_groups (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.users_groups OWNER TO postgres;

--
-- Name: users_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_user_permissions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.users_user_permissions OWNER TO postgres;

--
-- Name: users_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    token_id character varying(255) NOT NULL,
    token_type character varying(32) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (activity_id);


--
-- Name: admin_action_log admin_action_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_action_log
    ADD CONSTRAINT admin_action_log_pkey PRIMARY KEY (action_id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_otp_codes auth_otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_otp_codes
    ADD CONSTRAINT auth_otp_codes_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: availabilities availabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_pkey PRIMARY KEY (availability_id);


--
-- Name: axes_accessattempt axes_accessattempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.axes_accessattempt
    ADD CONSTRAINT axes_accessattempt_pkey PRIMARY KEY (id);


--
-- Name: axes_accessattempt axes_accessattempt_username_ip_address_user_agent_8ea22282_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.axes_accessattempt
    ADD CONSTRAINT axes_accessattempt_username_ip_address_user_agent_8ea22282_uniq UNIQUE (username, ip_address, user_agent);


--
-- Name: axes_accessfailurelog axes_accessfailurelog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.axes_accessfailurelog
    ADD CONSTRAINT axes_accessfailurelog_pkey PRIMARY KEY (id);


--
-- Name: axes_accesslog axes_accesslog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.axes_accesslog
    ADD CONSTRAINT axes_accesslog_pkey PRIMARY KEY (id);


--
-- Name: booking_status booking_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_status
    ADD CONSTRAINT booking_status_pkey PRIMARY KEY (status_id);


--
-- Name: booking_status booking_status_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_status
    ADD CONSTRAINT booking_status_status_name_key UNIQUE (status_name);


--
-- Name: bookings bookings_availability_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_availability_id_key UNIQUE (availability_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- Name: commission_adjustments commission_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_pkey PRIMARY KEY (adjustment_id);


--
-- Name: courts courts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_pkey PRIMARY KEY (court_id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (facility_id);


--
-- Name: facility_request_sport_types facility_request_sport_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_request_sport_types
    ADD CONSTRAINT facility_request_sport_types_pkey PRIMARY KEY (id);


--
-- Name: facility_requests facility_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_requests
    ADD CONSTRAINT facility_requests_pkey PRIMARY KEY (request_id);


--
-- Name: facility_reviews facility_reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_reviews
    ADD CONSTRAINT facility_reviews_booking_id_key UNIQUE (booking_id);


--
-- Name: facility_reviews facility_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_reviews
    ADD CONSTRAINT facility_reviews_pkey PRIMARY KEY (review_id);


--
-- Name: facility_suspensions facility_suspensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_suspensions
    ADD CONSTRAINT facility_suspensions_pkey PRIMARY KEY (suspension_id);


--
-- Name: manager manager_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager
    ADD CONSTRAINT manager_pkey PRIMARY KEY (user_id);


--
-- Name: manager_request_sport_types manager_request_sport_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_request_sport_types
    ADD CONSTRAINT manager_request_sport_types_pkey PRIMARY KEY (id);


--
-- Name: manager_requests manager_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_requests
    ADD CONSTRAINT manager_requests_pkey PRIMARY KEY (request_id);


--
-- Name: manager_suspensions manager_suspensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_suspensions
    ADD CONSTRAINT manager_suspensions_pkey PRIMARY KEY (suspension_id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (payment_method_id);


--
-- Name: payment_status payment_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_status
    ADD CONSTRAINT payment_status_pkey PRIMARY KEY (status_id);


--
-- Name: payment_status payment_status_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_status
    ADD CONSTRAINT payment_status_status_name_key UNIQUE (status_name);


--
-- Name: payments payments_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (request_id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);


--
-- Name: reservation_slots reservation_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_slots
    ADD CONSTRAINT reservation_slots_pkey PRIMARY KEY (reservation_slot_id);


--
-- Name: reservation_slots reservation_slots_reservation_id_availability_id_507e1a21_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_slots
    ADD CONSTRAINT reservation_slots_reservation_id_availability_id_507e1a21_uniq UNIQUE (reservation_id, availability_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (session_id);


--
-- Name: sport_types sport_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sport_types
    ADD CONSTRAINT sport_types_pkey PRIMARY KEY (sport_type_id);


--
-- Name: sport_types sport_types_sport_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sport_types
    ADD CONSTRAINT sport_types_sport_name_key UNIQUE (sport_name);


--
-- Name: temporary_reservations temporary_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_pkey PRIMARY KEY (reservation_id);


--
-- Name: availabilities unique_availability_composite; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT unique_availability_composite UNIQUE (availability_id, court_id, start_time, end_time);


--
-- Name: bookings unique_court_booking_time; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT unique_court_booking_time UNIQUE (court_id, start_time);


--
-- Name: courts unique_court_per_facility; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT unique_court_per_facility UNIQUE (facility_id, name);


--
-- Name: availabilities unique_court_start_time; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT unique_court_start_time UNIQUE (court_id, start_time);


--
-- Name: facility_request_sport_types unique_facility_request_sport_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_request_sport_types
    ADD CONSTRAINT unique_facility_request_sport_type UNIQUE (request_id, sport_type_id);


--
-- Name: payments unique_provider_payment; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT unique_provider_payment UNIQUE (provider, provider_payment_id);


--
-- Name: manager_request_sport_types unique_request_sport_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_request_sport_types
    ADD CONSTRAINT unique_request_sport_type UNIQUE (request_id, sport_type_id);


--
-- Name: facility_reviews unique_user_booking_review; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_reviews
    ADD CONSTRAINT unique_user_booking_review UNIQUE (user_id, booking_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_groups users_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT users_groups_pkey PRIMARY KEY (id);


--
-- Name: users_groups users_groups_user_id_group_id_fc7788e8_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT users_groups_user_id_group_id_fc7788e8_uniq UNIQUE (user_id, group_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users_user_permissions users_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_permissions
    ADD CONSTRAINT users_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: users_user_permissions users_user_permissions_user_id_permission_id_3b86cbdf_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_permissions
    ADD CONSTRAINT users_user_permissions_user_id_permission_id_3b86cbdf_uniq UNIQUE (user_id, permission_id);


--
-- Name: facility_requests ux_facreq_submitter_facility_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_requests
    ADD CONSTRAINT ux_facreq_submitter_facility_key UNIQUE (facility_name, facility_address, submitted_by_id);


--
-- Name: manager_requests ux_mgr_req_user_facility_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_requests
    ADD CONSTRAINT ux_mgr_req_user_facility_key UNIQUE (facility_name, facility_address, user_id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (token_id);


--
-- Name: activity_log_user_id_f1e09264; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX activity_log_user_id_f1e09264 ON public.activity_log USING btree (user_id);


--
-- Name: admin_action_log_admin_user_id_e4e2a3cd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admin_action_log_admin_user_id_e4e2a3cd ON public.admin_action_log USING btree (admin_user_id);


--
-- Name: admin_action_log_target_user_id_3f9286fd; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admin_action_log_target_user_id_3f9286fd ON public.admin_action_log USING btree (target_user_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_otp_co_code_366bfc_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_otp_co_code_366bfc_idx ON public.auth_otp_codes USING btree (code, is_used);


--
-- Name: auth_otp_co_user_id_4942d0_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_otp_co_user_id_4942d0_idx ON public.auth_otp_codes USING btree (user_id, created_at DESC);


--
-- Name: auth_otp_codes_user_id_0a9070ce; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_otp_codes_user_id_0a9070ce ON public.auth_otp_codes USING btree (user_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: availabilities_court_id_3cc4edac; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX availabilities_court_id_3cc4edac ON public.availabilities USING btree (court_id);


--
-- Name: axes_accessattempt_ip_address_10922d9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessattempt_ip_address_10922d9c ON public.axes_accessattempt USING btree (ip_address);


--
-- Name: axes_accessattempt_user_agent_ad89678b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessattempt_user_agent_ad89678b ON public.axes_accessattempt USING btree (user_agent);


--
-- Name: axes_accessattempt_user_agent_ad89678b_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessattempt_user_agent_ad89678b_like ON public.axes_accessattempt USING btree (user_agent varchar_pattern_ops);


--
-- Name: axes_accessattempt_username_3f2d4ca0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessattempt_username_3f2d4ca0 ON public.axes_accessattempt USING btree (username);


--
-- Name: axes_accessattempt_username_3f2d4ca0_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessattempt_username_3f2d4ca0_like ON public.axes_accessattempt USING btree (username varchar_pattern_ops);


--
-- Name: axes_accessfailurelog_ip_address_2e9f5a7f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessfailurelog_ip_address_2e9f5a7f ON public.axes_accessfailurelog USING btree (ip_address);


--
-- Name: axes_accessfailurelog_user_agent_ea145dda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessfailurelog_user_agent_ea145dda ON public.axes_accessfailurelog USING btree (user_agent);


--
-- Name: axes_accessfailurelog_user_agent_ea145dda_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessfailurelog_user_agent_ea145dda_like ON public.axes_accessfailurelog USING btree (user_agent varchar_pattern_ops);


--
-- Name: axes_accessfailurelog_username_a8b7e8a4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessfailurelog_username_a8b7e8a4 ON public.axes_accessfailurelog USING btree (username);


--
-- Name: axes_accessfailurelog_username_a8b7e8a4_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accessfailurelog_username_a8b7e8a4_like ON public.axes_accessfailurelog USING btree (username varchar_pattern_ops);


--
-- Name: axes_accesslog_ip_address_86b417e5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accesslog_ip_address_86b417e5 ON public.axes_accesslog USING btree (ip_address);


--
-- Name: axes_accesslog_user_agent_0e659004; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accesslog_user_agent_0e659004 ON public.axes_accesslog USING btree (user_agent);


--
-- Name: axes_accesslog_user_agent_0e659004_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accesslog_user_agent_0e659004_like ON public.axes_accesslog USING btree (user_agent varchar_pattern_ops);


--
-- Name: axes_accesslog_username_df93064b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accesslog_username_df93064b ON public.axes_accesslog USING btree (username);


--
-- Name: axes_accesslog_username_df93064b_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX axes_accesslog_username_df93064b_like ON public.axes_accesslog USING btree (username varchar_pattern_ops);


--
-- Name: booking_status_status_name_ffd40a51_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_status_status_name_ffd40a51_like ON public.booking_status USING btree (status_name varchar_pattern_ops);


--
-- Name: bookings_court_id_d5212cde; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_court_id_d5212cde ON public.bookings USING btree (court_id);


--
-- Name: bookings_status_id_40170da9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_status_id_40170da9 ON public.bookings USING btree (status_id);


--
-- Name: bookings_user_id_6e734b08; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_user_id_6e734b08 ON public.bookings USING btree (user_id);


--
-- Name: commission_adjustments_adjusted_by_id_0526579b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX commission_adjustments_adjusted_by_id_0526579b ON public.commission_adjustments USING btree (adjusted_by_id);


--
-- Name: commission_adjustments_facility_id_8e8ab493; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX commission_adjustments_facility_id_8e8ab493 ON public.commission_adjustments USING btree (facility_id);


--
-- Name: courts_facility_id_7f65d61e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX courts_facility_id_7f65d61e ON public.courts USING btree (facility_id);


--
-- Name: courts_sport_type_id_71beb06e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX courts_sport_type_id_71beb06e ON public.courts USING btree (sport_type_id);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: facilities_approved_by_id_73c63151; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facilities_approved_by_id_73c63151 ON public.facilities USING btree (approved_by_id);


--
-- Name: facilities_manager_id_b649f479; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facilities_manager_id_b649f479 ON public.facilities USING btree (manager_id);


--
-- Name: facilities_submitted_by_id_e320394e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facilities_submitted_by_id_e320394e ON public.facilities USING btree (submitted_by_id);


--
-- Name: facility_request_sport_types_request_id_d991b34d; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_request_sport_types_request_id_d991b34d ON public.facility_request_sport_types USING btree (request_id);


--
-- Name: facility_request_sport_types_sport_type_id_c05a3569; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_request_sport_types_sport_type_id_c05a3569 ON public.facility_request_sport_types USING btree (sport_type_id);


--
-- Name: facility_requests_admin_user_id_b25a1074; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_requests_admin_user_id_b25a1074 ON public.facility_requests USING btree (admin_user_id);


--
-- Name: facility_requests_approved_facility_id_868e8b7e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_requests_approved_facility_id_868e8b7e ON public.facility_requests USING btree (approved_facility_id);


--
-- Name: facility_requests_submitted_by_id_3a70f2c4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_requests_submitted_by_id_3a70f2c4 ON public.facility_requests USING btree (submitted_by_id);


--
-- Name: facility_reviews_facility_id_d928644a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_reviews_facility_id_d928644a ON public.facility_reviews USING btree (facility_id);


--
-- Name: facility_reviews_user_id_f89492a3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_reviews_user_id_f89492a3 ON public.facility_reviews USING btree (user_id);


--
-- Name: facility_suspensions_facility_id_9a9a226f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_suspensions_facility_id_9a9a226f ON public.facility_suspensions USING btree (facility_id);


--
-- Name: facility_suspensions_suspended_by_id_57c19fc5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_suspensions_suspended_by_id_57c19fc5 ON public.facility_suspensions USING btree (suspended_by_id);


--
-- Name: facility_suspensions_unsuspended_by_id_fd550bd5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX facility_suspensions_unsuspended_by_id_fd550bd5 ON public.facility_suspensions USING btree (unsuspended_by_id);


--
-- Name: idx_activity_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_action ON public.activity_log USING btree (action);


--
-- Name: idx_activity_user_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_user_time ON public.activity_log USING btree (user_id, created_at);


--
-- Name: idx_bookings_user_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_user_created_at ON public.bookings USING btree (user_id, created_at);


--
-- Name: idx_comm_adj_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comm_adj_admin ON public.commission_adjustments USING btree (adjusted_by_id);


--
-- Name: idx_comm_adj_facility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comm_adj_facility ON public.commission_adjustments USING btree (facility_id, effective_date);


--
-- Name: idx_fac_dupe_guard; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fac_dupe_guard ON public.facilities USING btree (facility_name, address);


--
-- Name: idx_fac_susp_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fac_susp_created ON public.facility_suspensions USING btree (suspended_at);


--
-- Name: idx_fac_susp_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fac_susp_expires ON public.facility_suspensions USING btree (expires_at);


--
-- Name: idx_fac_susp_facility_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fac_susp_facility_status ON public.facility_suspensions USING btree (facility_id, status);


--
-- Name: idx_facilities_latlon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facilities_latlon ON public.facilities USING btree (latitude, longitude);


--
-- Name: idx_facreq_facility_name_addr; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facreq_facility_name_addr ON public.facility_requests USING btree (facility_name, facility_address);


--
-- Name: idx_facreq_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facreq_status ON public.facility_requests USING btree (status, created_at);


--
-- Name: idx_facreq_submitter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facreq_submitter ON public.facility_requests USING btree (submitted_by_id);


--
-- Name: idx_manager_suspended; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_suspended ON public.manager USING btree (is_suspended);


--
-- Name: idx_mgr_req_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mgr_req_user ON public.manager_requests USING btree (user_id);


--
-- Name: idx_mgr_susp_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mgr_susp_created ON public.manager_suspensions USING btree (suspended_at);


--
-- Name: idx_mgr_susp_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mgr_susp_expires ON public.manager_suspensions USING btree (expires_at);


--
-- Name: idx_mgr_susp_manager_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mgr_susp_manager_status ON public.manager_suspensions USING btree (manager_id, status);


--
-- Name: idx_payment_methods_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_user ON public.payment_methods USING btree (user_id);


--
-- Name: idx_payments_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_booking ON public.payments USING btree (booking_id);


--
-- Name: idx_refund_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_booking ON public.refund_requests USING btree (booking_id);


--
-- Name: idx_refund_requester; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_requester ON public.refund_requests USING btree (requested_by_id);


--
-- Name: idx_refund_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refund_status ON public.refund_requests USING btree (status, created_at);


--
-- Name: idx_reports_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_assigned ON public.reports USING btree (assigned_to_id);


--
-- Name: idx_reports_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_resource ON public.reports USING btree (resource_type, resource_id);


--
-- Name: idx_reports_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_severity ON public.reports USING btree (severity, created_at);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: idx_res_slot_availability; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_res_slot_availability ON public.reservation_slots USING btree (availability_id);


--
-- Name: idx_reviews_facility_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_facility_created ON public.facility_reviews USING btree (facility_id, created_at);


--
-- Name: idx_reviews_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_user_created ON public.facility_reviews USING btree (user_id, created_at);


--
-- Name: idx_temp_res_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_temp_res_expires ON public.temporary_reservations USING btree (expires_at);


--
-- Name: idx_temp_res_user_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_temp_res_user_expires ON public.temporary_reservations USING btree (user_id, expires_at);


--
-- Name: manager_request_sport_types_request_id_47a5035c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_request_sport_types_request_id_47a5035c ON public.manager_request_sport_types USING btree (request_id);


--
-- Name: manager_request_sport_types_sport_type_id_6d1d14f3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_request_sport_types_sport_type_id_6d1d14f3 ON public.manager_request_sport_types USING btree (sport_type_id);


--
-- Name: manager_requests_admin_user_id_994e43de; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_requests_admin_user_id_994e43de ON public.manager_requests USING btree (admin_user_id);


--
-- Name: manager_requests_user_id_97fb6b1a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_requests_user_id_97fb6b1a ON public.manager_requests USING btree (user_id);


--
-- Name: manager_suspensions_manager_id_e9418177; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_suspensions_manager_id_e9418177 ON public.manager_suspensions USING btree (manager_id);


--
-- Name: manager_suspensions_suspended_by_id_b1abc585; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_suspensions_suspended_by_id_b1abc585 ON public.manager_suspensions USING btree (suspended_by_id);


--
-- Name: manager_suspensions_unsuspended_by_id_841696da; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX manager_suspensions_unsuspended_by_id_841696da ON public.manager_suspensions USING btree (unsuspended_by_id);


--
-- Name: payment_methods_user_id_d4fe6d88; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_methods_user_id_d4fe6d88 ON public.payment_methods USING btree (user_id);


--
-- Name: payment_status_status_name_86697ad5_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_status_status_name_86697ad5_like ON public.payment_status USING btree (status_name varchar_pattern_ops);


--
-- Name: payments_booking_id_fa2b6c3e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_booking_id_fa2b6c3e ON public.payments USING btree (booking_id);


--
-- Name: payments_idempotency_key_b37fd3db_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_idempotency_key_b37fd3db_like ON public.payments USING btree (idempotency_key varchar_pattern_ops);


--
-- Name: payments_payment_method_id_83b27e37; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_payment_method_id_83b27e37 ON public.payments USING btree (payment_method_id);


--
-- Name: payments_status_id_59e5077a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status_id_59e5077a ON public.payments USING btree (status_id);


--
-- Name: refund_requests_booking_id_35516ca9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refund_requests_booking_id_35516ca9 ON public.refund_requests USING btree (booking_id);


--
-- Name: refund_requests_requested_by_id_ca20554a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refund_requests_requested_by_id_ca20554a ON public.refund_requests USING btree (requested_by_id);


--
-- Name: refund_requests_reviewed_by_id_81a63f8b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refund_requests_reviewed_by_id_81a63f8b ON public.refund_requests USING btree (reviewed_by_id);


--
-- Name: reports_assigned_to_id_ccc64888; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_assigned_to_id_ccc64888 ON public.reports USING btree (assigned_to_id);


--
-- Name: reports_reporter_user_id_df302b5f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_reporter_user_id_df302b5f ON public.reports USING btree (reporter_user_id);


--
-- Name: reports_resolved_by_id_6fe4a539; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_resolved_by_id_6fe4a539 ON public.reports USING btree (resolved_by_id);


--
-- Name: reservation_slots_availability_id_f812bc67; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reservation_slots_availability_id_f812bc67 ON public.reservation_slots USING btree (availability_id);


--
-- Name: reservation_slots_reservation_id_1229c9c9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reservation_slots_reservation_id_1229c9c9 ON public.reservation_slots USING btree (reservation_id);


--
-- Name: sessions_session_id_5cb0abd8_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_session_id_5cb0abd8_like ON public.sessions USING btree (session_id varchar_pattern_ops);


--
-- Name: sessions_user_id_05e26f4a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_05e26f4a ON public.sessions USING btree (user_id);


--
-- Name: sport_types_sport_name_d7fcf9e5_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sport_types_sport_name_d7fcf9e5_like ON public.sport_types USING btree (sport_name varchar_pattern_ops);


--
-- Name: temporary_reservations_user_id_56c45644; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX temporary_reservations_user_id_56c45644 ON public.temporary_reservations USING btree (user_id);


--
-- Name: users_email_0ea73cca_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_0ea73cca_like ON public.users USING btree (email varchar_pattern_ops);


--
-- Name: users_groups_group_id_2f3517aa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_group_id_2f3517aa ON public.users_groups USING btree (group_id);


--
-- Name: users_groups_user_id_f500bee5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_user_id_f500bee5 ON public.users_groups USING btree (user_id);


--
-- Name: users_user_permissions_permission_id_6d08dcd2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_permissions_permission_id_6d08dcd2 ON public.users_user_permissions USING btree (permission_id);


--
-- Name: users_user_permissions_user_id_92473840; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_user_permissions_user_id_92473840 ON public.users_user_permissions USING btree (user_id);


--
-- Name: ux_facilities_manager_name_nonnull; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_facilities_manager_name_nonnull ON public.facilities USING btree (manager_id, facility_name) WHERE (manager_id IS NOT NULL);


--
-- Name: verification_tokens_token_id_48fce852_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_tokens_token_id_48fce852_like ON public.verification_tokens USING btree (token_id varchar_pattern_ops);


--
-- Name: verification_tokens_user_id_79052e9e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_tokens_user_id_79052e9e ON public.verification_tokens USING btree (user_id);


--
-- Name: activity_log activity_log_user_id_f1e09264_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_f1e09264_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: admin_action_log admin_action_log_admin_user_id_e4e2a3cd_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_action_log
    ADD CONSTRAINT admin_action_log_admin_user_id_e4e2a3cd_fk_users_user_id FOREIGN KEY (admin_user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: admin_action_log admin_action_log_target_user_id_3f9286fd_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_action_log
    ADD CONSTRAINT admin_action_log_target_user_id_3f9286fd_fk_users_user_id FOREIGN KEY (target_user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_otp_codes auth_otp_codes_user_id_0a9070ce_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_otp_codes
    ADD CONSTRAINT auth_otp_codes_user_id_0a9070ce_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: availabilities availabilities_court_id_3cc4edac_fk_courts_court_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availabilities
    ADD CONSTRAINT availabilities_court_id_3cc4edac_fk_courts_court_id FOREIGN KEY (court_id) REFERENCES public.courts(court_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: bookings bookings_availability_id_ef838b85_fk_availabil; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_availability_id_ef838b85_fk_availabil FOREIGN KEY (availability_id) REFERENCES public.availabilities(availability_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: bookings bookings_court_id_d5212cde_fk_courts_court_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_court_id_d5212cde_fk_courts_court_id FOREIGN KEY (court_id) REFERENCES public.courts(court_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: bookings bookings_status_id_40170da9_fk_booking_status_status_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_status_id_40170da9_fk_booking_status_status_id FOREIGN KEY (status_id) REFERENCES public.booking_status(status_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: bookings bookings_user_id_6e734b08_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_6e734b08_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: commission_adjustments commission_adjustmen_facility_id_8e8ab493_fk_facilitie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustmen_facility_id_8e8ab493_fk_facilitie FOREIGN KEY (facility_id) REFERENCES public.facilities(facility_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: commission_adjustments commission_adjustments_adjusted_by_id_0526579b_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_adjusted_by_id_0526579b_fk_users_user_id FOREIGN KEY (adjusted_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: courts courts_facility_id_7f65d61e_fk_facilities_facility_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_facility_id_7f65d61e_fk_facilities_facility_id FOREIGN KEY (facility_id) REFERENCES public.facilities(facility_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: courts courts_sport_type_id_71beb06e_fk_sport_types_sport_type_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_sport_type_id_71beb06e_fk_sport_types_sport_type_id FOREIGN KEY (sport_type_id) REFERENCES public.sport_types(sport_type_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facilities facilities_approved_by_id_73c63151_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_approved_by_id_73c63151_fk_users_user_id FOREIGN KEY (approved_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facilities facilities_manager_id_b649f479_fk_manager_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_manager_id_b649f479_fk_manager_user_id FOREIGN KEY (manager_id) REFERENCES public.manager(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facilities facilities_submitted_by_id_e320394e_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_submitted_by_id_e320394e_fk_users_user_id FOREIGN KEY (submitted_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_request_sport_types facility_request_spo_request_id_d991b34d_fk_facility_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_request_sport_types
    ADD CONSTRAINT facility_request_spo_request_id_d991b34d_fk_facility_ FOREIGN KEY (request_id) REFERENCES public.facility_requests(request_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_request_sport_types facility_request_spo_sport_type_id_c05a3569_fk_sport_typ; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_request_sport_types
    ADD CONSTRAINT facility_request_spo_sport_type_id_c05a3569_fk_sport_typ FOREIGN KEY (sport_type_id) REFERENCES public.sport_types(sport_type_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_requests facility_requests_admin_user_id_b25a1074_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_requests
    ADD CONSTRAINT facility_requests_admin_user_id_b25a1074_fk_users_user_id FOREIGN KEY (admin_user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_requests facility_requests_approved_facility_id_868e8b7e_fk_facilitie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_requests
    ADD CONSTRAINT facility_requests_approved_facility_id_868e8b7e_fk_facilitie FOREIGN KEY (approved_facility_id) REFERENCES public.facilities(facility_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_requests facility_requests_submitted_by_id_3a70f2c4_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_requests
    ADD CONSTRAINT facility_requests_submitted_by_id_3a70f2c4_fk_users_user_id FOREIGN KEY (submitted_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_reviews facility_reviews_booking_id_4cbeb72f_fk_bookings_booking_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_reviews
    ADD CONSTRAINT facility_reviews_booking_id_4cbeb72f_fk_bookings_booking_id FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_reviews facility_reviews_facility_id_d928644a_fk_facilities_facility_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_reviews
    ADD CONSTRAINT facility_reviews_facility_id_d928644a_fk_facilities_facility_id FOREIGN KEY (facility_id) REFERENCES public.facilities(facility_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_reviews facility_reviews_user_id_f89492a3_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_reviews
    ADD CONSTRAINT facility_reviews_user_id_f89492a3_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_suspensions facility_suspensions_facility_id_9a9a226f_fk_facilitie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_suspensions
    ADD CONSTRAINT facility_suspensions_facility_id_9a9a226f_fk_facilitie FOREIGN KEY (facility_id) REFERENCES public.facilities(facility_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_suspensions facility_suspensions_suspended_by_id_57c19fc5_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_suspensions
    ADD CONSTRAINT facility_suspensions_suspended_by_id_57c19fc5_fk_users_user_id FOREIGN KEY (suspended_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: facility_suspensions facility_suspensions_unsuspended_by_id_fd550bd5_fk_users_use; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_suspensions
    ADD CONSTRAINT facility_suspensions_unsuspended_by_id_fd550bd5_fk_users_use FOREIGN KEY (unsuspended_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_request_sport_types manager_request_spor_request_id_47a5035c_fk_manager_r; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_request_sport_types
    ADD CONSTRAINT manager_request_spor_request_id_47a5035c_fk_manager_r FOREIGN KEY (request_id) REFERENCES public.manager_requests(request_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_request_sport_types manager_request_spor_sport_type_id_6d1d14f3_fk_sport_typ; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_request_sport_types
    ADD CONSTRAINT manager_request_spor_sport_type_id_6d1d14f3_fk_sport_typ FOREIGN KEY (sport_type_id) REFERENCES public.sport_types(sport_type_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_requests manager_requests_admin_user_id_994e43de_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_requests
    ADD CONSTRAINT manager_requests_admin_user_id_994e43de_fk_users_user_id FOREIGN KEY (admin_user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_requests manager_requests_user_id_97fb6b1a_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_requests
    ADD CONSTRAINT manager_requests_user_id_97fb6b1a_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_suspensions manager_suspensions_manager_id_e9418177_fk_manager_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_suspensions
    ADD CONSTRAINT manager_suspensions_manager_id_e9418177_fk_manager_user_id FOREIGN KEY (manager_id) REFERENCES public.manager(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_suspensions manager_suspensions_suspended_by_id_b1abc585_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_suspensions
    ADD CONSTRAINT manager_suspensions_suspended_by_id_b1abc585_fk_users_user_id FOREIGN KEY (suspended_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager_suspensions manager_suspensions_unsuspended_by_id_841696da_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_suspensions
    ADD CONSTRAINT manager_suspensions_unsuspended_by_id_841696da_fk_users_user_id FOREIGN KEY (unsuspended_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: manager manager_user_id_03d26107_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager
    ADD CONSTRAINT manager_user_id_03d26107_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: payment_methods payment_methods_user_id_d4fe6d88_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_d4fe6d88_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: payments payments_booking_id_fa2b6c3e_fk_bookings_booking_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fa2b6c3e_fk_bookings_booking_id FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: payments payments_payment_method_id_83b27e37_fk_payment_m; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_method_id_83b27e37_fk_payment_m FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(payment_method_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: payments payments_status_id_59e5077a_fk_payment_status_status_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_status_id_59e5077a_fk_payment_status_status_id FOREIGN KEY (status_id) REFERENCES public.payment_status(status_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: refund_requests refund_requests_booking_id_35516ca9_fk_bookings_booking_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_booking_id_35516ca9_fk_bookings_booking_id FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: refund_requests refund_requests_requested_by_id_ca20554a_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_requested_by_id_ca20554a_fk_users_user_id FOREIGN KEY (requested_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: refund_requests refund_requests_reviewed_by_id_81a63f8b_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_reviewed_by_id_81a63f8b_fk_users_user_id FOREIGN KEY (reviewed_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: reports reports_assigned_to_id_ccc64888_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_assigned_to_id_ccc64888_fk_users_user_id FOREIGN KEY (assigned_to_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: reports reports_reporter_user_id_df302b5f_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_user_id_df302b5f_fk_users_user_id FOREIGN KEY (reporter_user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: reports reports_resolved_by_id_6fe4a539_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_resolved_by_id_6fe4a539_fk_users_user_id FOREIGN KEY (resolved_by_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: reservation_slots reservation_slots_availability_id_f812bc67_fk_availabil; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_slots
    ADD CONSTRAINT reservation_slots_availability_id_f812bc67_fk_availabil FOREIGN KEY (availability_id) REFERENCES public.availabilities(availability_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: reservation_slots reservation_slots_reservation_id_1229c9c9_fk_temporary; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_slots
    ADD CONSTRAINT reservation_slots_reservation_id_1229c9c9_fk_temporary FOREIGN KEY (reservation_id) REFERENCES public.temporary_reservations(reservation_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: sessions sessions_user_id_05e26f4a_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_05e26f4a_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: temporary_reservations temporary_reservations_user_id_56c45644_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_user_id_56c45644_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_groups users_groups_group_id_2f3517aa_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT users_groups_group_id_2f3517aa_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_groups users_groups_user_id_f500bee5_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT users_groups_user_id_f500bee5_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user_permissions users_user_permissio_permission_id_6d08dcd2_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_permissions
    ADD CONSTRAINT users_user_permissio_permission_id_6d08dcd2_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: users_user_permissions users_user_permissions_user_id_92473840_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_user_permissions
    ADD CONSTRAINT users_user_permissions_user_id_92473840_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: verification_tokens verification_tokens_user_id_79052e9e_fk_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_user_id_79052e9e_fk_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict dR0F3gVxFixJQU6LHEXMeW6h9uGHbD60JcTIhXMg4LBahpWEyUataE05AKMuetM

