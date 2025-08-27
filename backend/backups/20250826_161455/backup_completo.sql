--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-1.pgdg24.04+1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: projeto_ecommerce_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO projeto_ecommerce_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: projeto_ecommerce_user
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Administrador; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."Administrador" (
    "AdminID" integer NOT NULL,
    "Nome" text NOT NULL,
    "Email" text NOT NULL,
    "SenhaHash" text NOT NULL,
    "Cargo" text,
    "NivelAcesso" integer DEFAULT 1 NOT NULL,
    "Ativo" boolean DEFAULT true NOT NULL,
    "CriadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Administrador" OWNER TO projeto_ecommerce_user;

--
-- Name: Administrador_AdminID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."Administrador_AdminID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Administrador_AdminID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: Administrador_AdminID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."Administrador_AdminID_seq" OWNED BY public."Administrador"."AdminID";


--
-- Name: Categoria; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."Categoria" (
    "CategoriaID" integer NOT NULL,
    "Nome" text NOT NULL
);


ALTER TABLE public."Categoria" OWNER TO projeto_ecommerce_user;

--
-- Name: Categoria_CategoriaID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."Categoria_CategoriaID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Categoria_CategoriaID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: Categoria_CategoriaID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."Categoria_CategoriaID_seq" OWNED BY public."Categoria"."CategoriaID";


--
-- Name: Cliente; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."Cliente" (
    "ClienteID" integer NOT NULL,
    "CodigoCliente" integer NOT NULL,
    "NomeCompleto" text NOT NULL,
    "DataNascimento" timestamp(3) without time zone,
    "TipoPessoa" text,
    "CPF_CNPJ" character varying(255) NOT NULL,
    "TelefoneFixo" text,
    "TelefoneCelular" text,
    "Whatsapp" text,
    "Email" text NOT NULL,
    "InscricaoEstadual" text,
    "InscricaoMunicipal" text,
    "RazaoSocial" text,
    "SenhaHash" text NOT NULL
);


ALTER TABLE public."Cliente" OWNER TO projeto_ecommerce_user;

--
-- Name: Cliente_ClienteID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."Cliente_ClienteID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Cliente_ClienteID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: Cliente_ClienteID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."Cliente_ClienteID_seq" OWNED BY public."Cliente"."ClienteID";


--
-- Name: Endereco; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."Endereco" (
    "EnderecoID" integer NOT NULL,
    "ClienteID" integer NOT NULL,
    "Nome" text NOT NULL,
    "Complemento" text,
    "CEP" text NOT NULL,
    "CodigoIBGE" text,
    "Cidade" text NOT NULL,
    "UF" text NOT NULL,
    "TipoEndereco" text DEFAULT 'Residencial'::text NOT NULL,
    "Numero" text,
    "Bairro" text NOT NULL
);


ALTER TABLE public."Endereco" OWNER TO projeto_ecommerce_user;

--
-- Name: Endereco_EnderecoID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."Endereco_EnderecoID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Endereco_EnderecoID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: Endereco_EnderecoID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."Endereco_EnderecoID_seq" OWNED BY public."Endereco"."EnderecoID";


--
-- Name: ItensPedido; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."ItensPedido" (
    "ItemID" integer NOT NULL,
    "PedidoID" integer NOT NULL,
    "ProdutoID" integer NOT NULL,
    "Quantidade" integer NOT NULL,
    "PrecoUnitario" double precision NOT NULL
);


ALTER TABLE public."ItensPedido" OWNER TO projeto_ecommerce_user;

--
-- Name: ItensPedido_ItemID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."ItensPedido_ItemID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ItensPedido_ItemID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: ItensPedido_ItemID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."ItensPedido_ItemID_seq" OWNED BY public."ItensPedido"."ItemID";


--
-- Name: MetodoPagamento; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."MetodoPagamento" (
    "MetodoID" integer NOT NULL,
    "Nome" text NOT NULL,
    "Ativo" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."MetodoPagamento" OWNER TO projeto_ecommerce_user;

--
-- Name: MetodoPagamento_MetodoID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."MetodoPagamento_MetodoID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MetodoPagamento_MetodoID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: MetodoPagamento_MetodoID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."MetodoPagamento_MetodoID_seq" OWNED BY public."MetodoPagamento"."MetodoID";


--
-- Name: PagamentosPedido; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."PagamentosPedido" (
    "PagamentoID" integer NOT NULL,
    "PedidoID" integer NOT NULL,
    "MetodoID" integer NOT NULL,
    "ValorPago" double precision NOT NULL,
    "StatusPagamento" text DEFAULT 'Pendente'::text NOT NULL,
    "DataPagamento" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PagamentosPedido" OWNER TO projeto_ecommerce_user;

--
-- Name: PagamentosPedido_PagamentoID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."PagamentosPedido_PagamentoID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PagamentosPedido_PagamentoID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: PagamentosPedido_PagamentoID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."PagamentosPedido_PagamentoID_seq" OWNED BY public."PagamentosPedido"."PagamentoID";


--
-- Name: Pedido; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."Pedido" (
    "PedidoID" integer NOT NULL,
    "ClienteID" integer NOT NULL,
    "EnderecoID" integer NOT NULL,
    "DataPedido" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "Status" text,
    "Total" double precision NOT NULL
);


ALTER TABLE public."Pedido" OWNER TO projeto_ecommerce_user;

--
-- Name: Pedido_PedidoID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."Pedido_PedidoID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Pedido_PedidoID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: Pedido_PedidoID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."Pedido_PedidoID_seq" OWNED BY public."Pedido"."PedidoID";


--
-- Name: Produto; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public."Produto" (
    "ProdutoID" integer NOT NULL,
    "Nome" text NOT NULL,
    "Descricao" text,
    "Preco" double precision NOT NULL,
    "Estoque" integer DEFAULT 0 NOT NULL,
    "CategoriaID" integer NOT NULL
);


ALTER TABLE public."Produto" OWNER TO projeto_ecommerce_user;

--
-- Name: Produto_ProdutoID_seq; Type: SEQUENCE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE SEQUENCE public."Produto_ProdutoID_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Produto_ProdutoID_seq" OWNER TO projeto_ecommerce_user;

--
-- Name: Produto_ProdutoID_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: projeto_ecommerce_user
--

ALTER SEQUENCE public."Produto_ProdutoID_seq" OWNED BY public."Produto"."ProdutoID";


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: projeto_ecommerce_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO projeto_ecommerce_user;

--
-- Name: Administrador AdminID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Administrador" ALTER COLUMN "AdminID" SET DEFAULT nextval('public."Administrador_AdminID_seq"'::regclass);


--
-- Name: Categoria CategoriaID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Categoria" ALTER COLUMN "CategoriaID" SET DEFAULT nextval('public."Categoria_CategoriaID_seq"'::regclass);


--
-- Name: Cliente ClienteID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Cliente" ALTER COLUMN "ClienteID" SET DEFAULT nextval('public."Cliente_ClienteID_seq"'::regclass);


--
-- Name: Endereco EnderecoID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Endereco" ALTER COLUMN "EnderecoID" SET DEFAULT nextval('public."Endereco_EnderecoID_seq"'::regclass);


--
-- Name: ItensPedido ItemID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."ItensPedido" ALTER COLUMN "ItemID" SET DEFAULT nextval('public."ItensPedido_ItemID_seq"'::regclass);


--
-- Name: MetodoPagamento MetodoID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."MetodoPagamento" ALTER COLUMN "MetodoID" SET DEFAULT nextval('public."MetodoPagamento_MetodoID_seq"'::regclass);


--
-- Name: PagamentosPedido PagamentoID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."PagamentosPedido" ALTER COLUMN "PagamentoID" SET DEFAULT nextval('public."PagamentosPedido_PagamentoID_seq"'::regclass);


--
-- Name: Pedido PedidoID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Pedido" ALTER COLUMN "PedidoID" SET DEFAULT nextval('public."Pedido_PedidoID_seq"'::regclass);


--
-- Name: Produto ProdutoID; Type: DEFAULT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Produto" ALTER COLUMN "ProdutoID" SET DEFAULT nextval('public."Produto_ProdutoID_seq"'::regclass);


--
-- Data for Name: Administrador; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."Administrador" ("AdminID", "Nome", "Email", "SenhaHash", "Cargo", "NivelAcesso", "Ativo", "CriadoEm") FROM stdin;
\.


--
-- Data for Name: Categoria; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."Categoria" ("CategoriaID", "Nome") FROM stdin;
\.


--
-- Data for Name: Cliente; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."Cliente" ("ClienteID", "CodigoCliente", "NomeCompleto", "DataNascimento", "TipoPessoa", "CPF_CNPJ", "TelefoneFixo", "TelefoneCelular", "Whatsapp", "Email", "InscricaoEstadual", "InscricaoMunicipal", "RazaoSocial", "SenhaHash") FROM stdin;
6	100000	Pedro Italo de Oliveira Florencio	\N	Física	$2b$12$X2qFVXmttfwMHIE2NIDznu/wanuBe55.ka.d/m4bHMV92BHyvRbVC	\N	(85) 99728-5137	\N	pedroitalo609@gmail.com	\N	\N	\N	$2b$12$78MyBqq3JeH4E.sgPjE8D.wKWeBPsMQo6Y0PaMqInQQ/I4D2KndW.
7	100001	Beatriz Oliveira Marques	\N	Física	$2b$12$1Dd1YBWuTruS7fW7X0HR3uTGY6VoZI/qTMlkyKG7.lqse8RLHIu.u	(88) 99353-086	(88) 99353-086	\N	beatrizmarqs2023@gmail.com	\N	\N	\N	$2b$12$8/atT5i2jtw5k/mz1R9jXeeGtGdqWXimaXVQAJEIzFgE356K2j2m2
\.


--
-- Data for Name: Endereco; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."Endereco" ("EnderecoID", "ClienteID", "Nome", "Complemento", "CEP", "CodigoIBGE", "Cidade", "UF", "TipoEndereco", "Numero", "Bairro") FROM stdin;
6	6	Ipaguaçu Mirim	\N	62140-000	\N	Massapê	CE	Residencial	10	Alto Alegre
7	7	Grossos	\N	62140-000	\N	Massapê	CE	Residencial	31	Grossos
\.


--
-- Data for Name: ItensPedido; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."ItensPedido" ("ItemID", "PedidoID", "ProdutoID", "Quantidade", "PrecoUnitario") FROM stdin;
\.


--
-- Data for Name: MetodoPagamento; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."MetodoPagamento" ("MetodoID", "Nome", "Ativo") FROM stdin;
\.


--
-- Data for Name: PagamentosPedido; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."PagamentosPedido" ("PagamentoID", "PedidoID", "MetodoID", "ValorPago", "StatusPagamento", "DataPagamento") FROM stdin;
\.


--
-- Data for Name: Pedido; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."Pedido" ("PedidoID", "ClienteID", "EnderecoID", "DataPedido", "Status", "Total") FROM stdin;
\.


--
-- Data for Name: Produto; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public."Produto" ("ProdutoID", "Nome", "Descricao", "Preco", "Estoque", "CategoriaID") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: projeto_ecommerce_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8642dfe3-cad6-44ee-bee2-1a91b952e23a	0f4c08b414c44b18cd0e4ff622b68a74d62cf29270d5b6e263d27fc4847b5c60	2025-08-25 15:21:30.314956-03	20250824172507_init	\N	\N	2025-08-25 15:21:30.281631-03	1
e2f91439-def3-4c58-a13f-c8b32b824e4c	8e423e393d4e536d17fe6e9ced19d2d1643c52b600cd33b12feb71ee0fd0e846	2025-08-25 15:21:30.317617-03	20250825175333_add_numero_to_endereco	\N	\N	2025-08-25 15:21:30.315532-03	1
edac1b50-f9fe-4dde-bd45-107d4ca16060	016ae276d6f9ecc4452709222902f6f8ce904b7c335d0f460d8309b682121d50	2025-08-25 15:23:54.852957-03	20250825182354_add_bairro_field_to_endereco	\N	\N	2025-08-25 15:23:54.848541-03	1
8fbd18f8-70e7-4123-9921-f71ef4dd5bc5	d7bcbe469903dbbcd8a1e41d9f6c88df1dde7fdb9c378e6d5c6e9c4216de756f	2025-08-25 15:31:26.755324-03	20250825183126_increase_cpf_cnpj_length	\N	\N	2025-08-25 15:31:26.750648-03	1
61f7d40a-c87e-4345-b17b-caa5fb0207b5	0ada4f9de37dc8e9d3198fb45aa4482818ea20509ae6e7f7c55a65d2a9009b41	2025-08-25 20:34:40.358242-03	20250825233440_remove_autoincrement_codigo_cliente	\N	\N	2025-08-25 20:34:40.352708-03	1
\.


--
-- Name: Administrador_AdminID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."Administrador_AdminID_seq"', 1, false);


--
-- Name: Categoria_CategoriaID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."Categoria_CategoriaID_seq"', 1, false);


--
-- Name: Cliente_ClienteID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."Cliente_ClienteID_seq"', 7, true);


--
-- Name: Endereco_EnderecoID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."Endereco_EnderecoID_seq"', 7, true);


--
-- Name: ItensPedido_ItemID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."ItensPedido_ItemID_seq"', 1, false);


--
-- Name: MetodoPagamento_MetodoID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."MetodoPagamento_MetodoID_seq"', 1, false);


--
-- Name: PagamentosPedido_PagamentoID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."PagamentosPedido_PagamentoID_seq"', 1, false);


--
-- Name: Pedido_PedidoID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."Pedido_PedidoID_seq"', 1, false);


--
-- Name: Produto_ProdutoID_seq; Type: SEQUENCE SET; Schema: public; Owner: projeto_ecommerce_user
--

SELECT pg_catalog.setval('public."Produto_ProdutoID_seq"', 1, false);


--
-- Name: Administrador Administrador_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Administrador"
    ADD CONSTRAINT "Administrador_pkey" PRIMARY KEY ("AdminID");


--
-- Name: Categoria Categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Categoria"
    ADD CONSTRAINT "Categoria_pkey" PRIMARY KEY ("CategoriaID");


--
-- Name: Cliente Cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("ClienteID");


--
-- Name: Endereco Endereco_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Endereco"
    ADD CONSTRAINT "Endereco_pkey" PRIMARY KEY ("EnderecoID");


--
-- Name: ItensPedido ItensPedido_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."ItensPedido"
    ADD CONSTRAINT "ItensPedido_pkey" PRIMARY KEY ("ItemID");


--
-- Name: MetodoPagamento MetodoPagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."MetodoPagamento"
    ADD CONSTRAINT "MetodoPagamento_pkey" PRIMARY KEY ("MetodoID");


--
-- Name: PagamentosPedido PagamentosPedido_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."PagamentosPedido"
    ADD CONSTRAINT "PagamentosPedido_pkey" PRIMARY KEY ("PagamentoID");


--
-- Name: Pedido Pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_pkey" PRIMARY KEY ("PedidoID");


--
-- Name: Produto Produto_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Produto"
    ADD CONSTRAINT "Produto_pkey" PRIMARY KEY ("ProdutoID");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Administrador_Email_key; Type: INDEX; Schema: public; Owner: projeto_ecommerce_user
--

CREATE UNIQUE INDEX "Administrador_Email_key" ON public."Administrador" USING btree ("Email");


--
-- Name: Cliente_CPF_CNPJ_key; Type: INDEX; Schema: public; Owner: projeto_ecommerce_user
--

CREATE UNIQUE INDEX "Cliente_CPF_CNPJ_key" ON public."Cliente" USING btree ("CPF_CNPJ");


--
-- Name: Cliente_CodigoCliente_key; Type: INDEX; Schema: public; Owner: projeto_ecommerce_user
--

CREATE UNIQUE INDEX "Cliente_CodigoCliente_key" ON public."Cliente" USING btree ("CodigoCliente");


--
-- Name: Cliente_Email_key; Type: INDEX; Schema: public; Owner: projeto_ecommerce_user
--

CREATE UNIQUE INDEX "Cliente_Email_key" ON public."Cliente" USING btree ("Email");


--
-- Name: Endereco Endereco_ClienteID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Endereco"
    ADD CONSTRAINT "Endereco_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES public."Cliente"("ClienteID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ItensPedido ItensPedido_PedidoID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."ItensPedido"
    ADD CONSTRAINT "ItensPedido_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES public."Pedido"("PedidoID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ItensPedido ItensPedido_ProdutoID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."ItensPedido"
    ADD CONSTRAINT "ItensPedido_ProdutoID_fkey" FOREIGN KEY ("ProdutoID") REFERENCES public."Produto"("ProdutoID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PagamentosPedido PagamentosPedido_MetodoID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."PagamentosPedido"
    ADD CONSTRAINT "PagamentosPedido_MetodoID_fkey" FOREIGN KEY ("MetodoID") REFERENCES public."MetodoPagamento"("MetodoID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PagamentosPedido PagamentosPedido_PedidoID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."PagamentosPedido"
    ADD CONSTRAINT "PagamentosPedido_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES public."Pedido"("PedidoID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pedido Pedido_ClienteID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES public."Cliente"("ClienteID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pedido Pedido_EnderecoID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_EnderecoID_fkey" FOREIGN KEY ("EnderecoID") REFERENCES public."Endereco"("EnderecoID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Produto Produto_CategoriaID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: projeto_ecommerce_user
--

ALTER TABLE ONLY public."Produto"
    ADD CONSTRAINT "Produto_CategoriaID_fkey" FOREIGN KEY ("CategoriaID") REFERENCES public."Categoria"("CategoriaID") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: projeto_ecommerce_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO ecommerce_user;


--
-- Name: TABLE "Administrador"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."Administrador" TO ecommerce_user;


--
-- Name: SEQUENCE "Administrador_AdminID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."Administrador_AdminID_seq" TO ecommerce_user;


--
-- Name: TABLE "Categoria"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."Categoria" TO ecommerce_user;


--
-- Name: SEQUENCE "Categoria_CategoriaID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."Categoria_CategoriaID_seq" TO ecommerce_user;


--
-- Name: TABLE "Cliente"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."Cliente" TO ecommerce_user;


--
-- Name: SEQUENCE "Cliente_ClienteID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."Cliente_ClienteID_seq" TO ecommerce_user;


--
-- Name: TABLE "Endereco"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."Endereco" TO ecommerce_user;


--
-- Name: SEQUENCE "Endereco_EnderecoID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."Endereco_EnderecoID_seq" TO ecommerce_user;


--
-- Name: TABLE "ItensPedido"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."ItensPedido" TO ecommerce_user;


--
-- Name: SEQUENCE "ItensPedido_ItemID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."ItensPedido_ItemID_seq" TO ecommerce_user;


--
-- Name: TABLE "MetodoPagamento"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."MetodoPagamento" TO ecommerce_user;


--
-- Name: SEQUENCE "MetodoPagamento_MetodoID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."MetodoPagamento_MetodoID_seq" TO ecommerce_user;


--
-- Name: TABLE "PagamentosPedido"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."PagamentosPedido" TO ecommerce_user;


--
-- Name: SEQUENCE "PagamentosPedido_PagamentoID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."PagamentosPedido_PagamentoID_seq" TO ecommerce_user;


--
-- Name: TABLE "Pedido"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."Pedido" TO ecommerce_user;


--
-- Name: SEQUENCE "Pedido_PedidoID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."Pedido_PedidoID_seq" TO ecommerce_user;


--
-- Name: TABLE "Produto"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public."Produto" TO ecommerce_user;


--
-- Name: SEQUENCE "Produto_ProdutoID_seq"; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON SEQUENCE public."Produto_ProdutoID_seq" TO ecommerce_user;


--
-- Name: TABLE _prisma_migrations; Type: ACL; Schema: public; Owner: projeto_ecommerce_user
--

GRANT ALL ON TABLE public._prisma_migrations TO ecommerce_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO ecommerce_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO ecommerce_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO ecommerce_user;


--
-- PostgreSQL database dump complete
--

