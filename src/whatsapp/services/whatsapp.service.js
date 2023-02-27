"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAStartupService = void 0;
const baileys_1 = __importStar(require("@adiwajshing/baileys"));
const logger_config_1 = require("../../config/logger.config");
const path_config_1 = require("../../config/path.config");
const fs_1 = require("fs");
const path_1 = require("path");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const wa_types_1 = require("../types/wa.types");
const os_1 = require("os");
const pino_1 = __importDefault(require("pino"));
const child_process_1 = require("child_process");
const repository_manager_1 = require("../repository/repository.manager");
const node_mime_types_1 = require("node-mime-types");
const moment_1 = __importDefault(require("moment"));
(0, moment_1.default)().format('YYYY-MM-DD HH:mm:ss');
moment_1.default.locale('pt-br');
const class_validator_1 = require("class-validator");
const chat_dto_1 = require("../dto/chat.dto");
const exceptions_1 = require("../../exceptions");
const use_multi_file_auth_state_db_1 = require("../../utils/use-multi-file-auth-state-db");
const long_1 = __importDefault(require("long"));
class WAStartupService {
    constructor(configService, eventEmitter, repository) {
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.repository = repository;
        this.logger = new logger_config_1.Logger(WAStartupService.name);
        this.instance = {};
        this.localWebhook = {};
        this.stateConnection = {
            state: 'close',
        };
        this.storePath = (0, path_1.join)(path_config_1.ROOT_DIR, 'store');
        this.webhookMap = {
            'qrcode.updated': '/webhook/qrcode',
            'connection.update': '/webhook/connection-update',
            'messages.set': '/webhook/load-message',
            'messages.upsert': '/webhook/add-message',
            'messages.update': '/webhook/message-update',
            'send.message': '/webhook/add-message',
            'contacts.set': '/webhook/contacts',
            'contacts.upsert': '/webhook/contacts',
            'contacts.update': '/webhook/contacts',
            'presence.update': '/webhook/presence',
            'chats.set': '/webhook/chats',
            'chats.update': '/webhook/chats',
            'chats.upsert': '/webhook/chats',
            'chats.delete': '/webhook/chats',
            'group.upsert': '/webhook/groups',
            'group.update': '/webhook/groups',
            'group-participants.update': '/webhook/group-participants-updat',
        };
        this.cleanStore();
        this.instance.qrcode = { count: 0 };
    }
    set instanceName(name) {
        if (!name) {
            this.instance.name = (0, uuid_1.v4)();
            return;
        }
        this.instance.name = name;
        this.sendDataWebhook(wa_types_1.Events.STATUS_INSTANCE, {
            instance: this.instance.name,
            status: 'created',
        });
    }
    get instanceName() {
        return this.instance.name;
    }
    get wuid() {
        return this.instance.wuid;
    }
    getProfileName() {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            let profileName = (_b = (_a = this.client.user) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = this.client.user) === null || _c === void 0 ? void 0 : _c.verifiedName;
            if (!profileName) {
                if (this.configService.get('DATABASE').ENABLED) {
                    const collection = repository_manager_1.RepositoryBroker.dbServer
                        .db(this.configService.get('DATABASE').CONNECTION.DB_PREFIX_NAME +
                        '-instances')
                        .collection(this.instanceName);
                    const data = yield collection.findOne({ _id: 'creds' });
                    if (data) {
                        const creds = JSON.parse(JSON.stringify(data), baileys_1.BufferJSON.reviver);
                        profileName = ((_d = creds.me) === null || _d === void 0 ? void 0 : _d.name) || ((_e = creds.me) === null || _e === void 0 ? void 0 : _e.verifiedName);
                    }
                }
                else if ((0, fs_1.existsSync)((0, path_1.join)(path_config_1.INSTANCE_DIR, this.instanceName, 'creds.json'))) {
                    const creds = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(path_config_1.INSTANCE_DIR, this.instanceName, 'creds.json'), {
                        encoding: 'utf-8',
                    }));
                    profileName = ((_f = creds.me) === null || _f === void 0 ? void 0 : _f.name) || ((_g = creds.me) === null || _g === void 0 ? void 0 : _g.verifiedName);
                }
            }
            return profileName;
        });
    }
    get profilePictureUrl() {
        return this.instance.profilePictureUrl;
    }
    get qrCode() {
        var _a, _b;
        return {
            code: (_a = this.instance.qrcode) === null || _a === void 0 ? void 0 : _a.code,
            base64: (_b = this.instance.qrcode) === null || _b === void 0 ? void 0 : _b.base64,
        };
    }
    loadWebhook() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.repository.webhook.find(this.instanceName);
            this.localWebhook.url = data === null || data === void 0 ? void 0 : data.url;
            this.localWebhook.enabled = data === null || data === void 0 ? void 0 : data.enabled;
            this.localWebhook.STATUS_INSTANCE = data === null || data === void 0 ? void 0 : data.STATUS_INSTANCE;
            this.localWebhook.QRCODE_UPDATED = data === null || data === void 0 ? void 0 : data.QRCODE_UPDATED;
            this.localWebhook.MESSAGES_SET = data === null || data === void 0 ? void 0 : data.MESSAGES_SET;
            this.localWebhook.MESSAGES_UPDATE = data === null || data === void 0 ? void 0 : data.MESSAGES_UPDATE;
            this.localWebhook.MESSAGES_UPSERT = data === null || data === void 0 ? void 0 : data.MESSAGES_UPSERT;
            this.localWebhook.SEND_MESSAGE = data === null || data === void 0 ? void 0 : data.SEND_MESSAGE;
            this.localWebhook.CONTACTS_SET = data === null || data === void 0 ? void 0 : data.CONTACTS_SET;
            this.localWebhook.CONTACTS_UPSERT = data === null || data === void 0 ? void 0 : data.CONTACTS_UPSERT;
            this.localWebhook.CONTACTS_UPDATE = data === null || data === void 0 ? void 0 : data.CONTACTS_UPDATE;
            this.localWebhook.PRESENCE_UPDATE = data === null || data === void 0 ? void 0 : data.PRESENCE_UPDATE;
            this.localWebhook.CHATS_SET = data === null || data === void 0 ? void 0 : data.CHATS_SET;
            this.localWebhook.CHATS_UPSERT = data === null || data === void 0 ? void 0 : data.CHATS_UPSERT;
            this.localWebhook.CHATS_UPDATE = data === null || data === void 0 ? void 0 : data.CHATS_UPDATE;
            this.localWebhook.CONNECTION_UPDATE = data === null || data === void 0 ? void 0 : data.CONNECTION_UPDATE;
            this.localWebhook.GROUPS_UPSERT = data === null || data === void 0 ? void 0 : data.GROUPS_UPSERT;
            this.localWebhook.CHATS_DELETE = data === null || data === void 0 ? void 0 : data.CHATS_DELETE;
            this.localWebhook.GROUPS_UPDATE = data === null || data === void 0 ? void 0 : data.GROUPS_UPDATE;
            this.localWebhook.GROUP_PARTICIPANTS_UPDATE = data === null || data === void 0 ? void 0 : data.GROUP_PARTICIPANTS_UPDATE;
        });
    }
    setWebhook(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.repository.webhook.create(data, this.instanceName);
            Object.assign(this.localWebhook, data);
        });
    }
    findWebhook() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.webhook.find(this.instanceName);
        });
    }
    sendDataWebhook(event, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const webhook = this.configService.get('WEBHOOK');
            const we = event.replace(/[\.-]/gm, '_').toUpperCase();
            const baseURL = webhook.MAP ? this.localWebhook.url + this.webhookMap[event] : this.localWebhook.url;
            const statusHook = this.localWebhook[we];
            if (statusHook) {
                try {
                    if (this.localWebhook.enabled && (0, class_validator_1.isURL)(this.localWebhook.url)) {
                        const httpService = axios_1.default.create({ baseURL });
                        yield httpService.post('', {
                            event,
                            instance: this.instance.name,
                            data,
                        }, { params: { owner: this.instance.wuid } });
                    }
                }
                catch (error) {
                    this.logger.error({
                        local: WAStartupService.name + '.sendDataWebhook-local',
                        message: error === null || error === void 0 ? void 0 : error.message,
                        hostName: error === null || error === void 0 ? void 0 : error.hostname,
                        syscall: error === null || error === void 0 ? void 0 : error.syscall,
                        code: error === null || error === void 0 ? void 0 : error.code,
                        error: error === null || error === void 0 ? void 0 : error.errno,
                        stack: error === null || error === void 0 ? void 0 : error.stack,
                        name: error === null || error === void 0 ? void 0 : error.name,
                    });
                }
                try {
                    const globalWebhhok = this.configService.get('WEBHOOK').GLOBAL;
                    if (globalWebhhok && (globalWebhhok === null || globalWebhhok === void 0 ? void 0 : globalWebhhok.ENABLED) && (0, class_validator_1.isURL)(globalWebhhok.URL)) {
                        const baseURL = webhook.MAP
                            ? globalWebhhok.URL + this.webhookMap[event]
                            : globalWebhhok.URL;
                        const httpService = axios_1.default.create({ baseURL });
                        yield httpService.post('', {
                            event,
                            instance: this.instance.name,
                            data,
                        }, { params: { owner: this.instance.wuid } });
                    }
                }
                catch (error) {
                    this.logger.error({
                        local: WAStartupService.name + '.sendDataWebhook-global',
                        message: error === null || error === void 0 ? void 0 : error.message,
                        hostName: error === null || error === void 0 ? void 0 : error.hostname,
                        syscall: error === null || error === void 0 ? void 0 : error.syscall,
                        code: error === null || error === void 0 ? void 0 : error.code,
                        error: error === null || error === void 0 ? void 0 : error.errno,
                        stack: error === null || error === void 0 ? void 0 : error.stack,
                        name: error === null || error === void 0 ? void 0 : error.name,
                    });
                }
            }
        });
    }
    connectionUpdate(ev) {
        return __awaiter(this, void 0, void 0, function* () {
            ev.on('connection.update', ({ qr, connection, lastDisconnect }) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                if (qr) {
                    if (this.instance.qrcode.count === this.configService.get('QRCODE').LIMIT) {
                        this.sendDataWebhook(wa_types_1.Events.QRCODE_UPDATED, {
                            message: 'QR code limit reached, please login again',
                            statusCode: baileys_1.DisconnectReason.badSession,
                        });
                        this.sendDataWebhook(wa_types_1.Events.CONNECTION_UPDATE, {
                            instance: this.instance.name,
                            state: 'refused',
                            statusReason: baileys_1.DisconnectReason.connectionClosed,
                        });
                        this.sendDataWebhook(wa_types_1.Events.STATUS_INSTANCE, {
                            instance: this.instance.name,
                            status: 'removed',
                        });
                        this.client.ev.removeAllListeners('connection.update');
                        delete this.client.ev.on;
                        return this.eventEmitter.emit('no.connection', this.instance.name);
                    }
                    this.instance.qrcode.count++;
                    const optsQrcode = {
                        margin: 3,
                        scale: 4,
                        errorCorrectionLevel: 'H',
                        color: { light: '#ffffff', dark: '#198754' },
                    };
                    qrcode_1.default.toDataURL(qr, optsQrcode, (error, base64) => {
                        if (error) {
                            this.logger.error('Qrcode generare failed:' + error.toString());
                            return;
                        }
                        this.instance.qrcode.base64 = base64;
                        this.instance.qrcode.code = qr;
                        this.sendDataWebhook(wa_types_1.Events.QRCODE_UPDATED, {
                            qrcode: { instance: this.instance.name, code: qr, base64 },
                        });
                    });
                    qrcode_terminal_1.default.generate(qr, { small: true }, (qrcode) => this.logger.log(`\n{ instance: ${this.instance.name}, qrcodeCount: ${this.instance.qrcode.count} }\n` +
                        qrcode));
                }
                if (connection) {
                    this.stateConnection = {
                        state: connection,
                        statusReason: (_c = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== null && _c !== void 0 ? _c : 200,
                    };
                    this.sendDataWebhook(wa_types_1.Events.CONNECTION_UPDATE, Object.assign({ instance: this.instance.name }, this.stateConnection));
                }
                if (connection === 'close') {
                    const shouldRecnnect = ((_e = (_d = lastDisconnect.error) === null || _d === void 0 ? void 0 : _d.output) === null || _e === void 0 ? void 0 : _e.statusCode) !==
                        baileys_1.DisconnectReason.loggedOut;
                    if (shouldRecnnect) {
                        yield this.connectToWhatsapp();
                    }
                    else {
                        this.sendDataWebhook(wa_types_1.Events.STATUS_INSTANCE, {
                            instance: this.instance.name,
                            status: 'removed',
                        });
                        return this.eventEmitter.emit('remove.instance', this.instance.name);
                    }
                }
                if (connection === 'open') {
                    this.setHandles(this.client.ev);
                    this.instance.wuid = this.client.user.id.replace(/:\d+/, '');
                    this.instance.profilePictureUrl = (yield this.profilePicture(this.instance.wuid)).profilePictureUrl;
                    this.logger.info(`
          ┌──────────────────────────────┐
          │    CONNECTED TO WHATSAPP     │
          └──────────────────────────────┘`.replace(/^ +/gm, '  '));
                }
            }));
        });
    }
    getMessage(key, full = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const webMessageInfo = (yield this.repository.message.find({
                    where: { owner: this.instance.wuid, key: { id: key.id } },
                }));
                if (full) {
                    return webMessageInfo[0];
                }
                return webMessageInfo[0].message;
            }
            catch (error) {
                return { conversation: '' };
            }
        });
    }
    cleanStore() {
        var _a;
        const store = this.configService.get('STORE');
        const database = this.configService.get('DATABASE');
        if ((store === null || store === void 0 ? void 0 : store.CLEANING_INTERVAL) && !database.ENABLED) {
            setInterval(() => {
                try {
                    for (const [key, value] of Object.entries(store)) {
                        if (value === true) {
                            (0, child_process_1.execSync)(`rm -rf ${(0, path_1.join)(this.storePath, key.toLowerCase(), this.instance.wuid)}/*.json`);
                        }
                    }
                }
                catch (error) { }
            }, ((_a = store === null || store === void 0 ? void 0 : store.CLEANING_INTERVAL) !== null && _a !== void 0 ? _a : 3600) * 1000);
        }
    }
    connectToWhatsapp() {
        return __awaiter(this, void 0, void 0, function* () {
            this.loadWebhook();
            const db = this.configService.get('DATABASE');
            this.instance.authState =
                db.ENABLED && db.SAVE_DATA.INSTANCE
                    ? yield (0, use_multi_file_auth_state_db_1.useMultiFileAuthStateDb)(this.instance.name)
                    : yield (0, baileys_1.useMultiFileAuthState)((0, path_1.join)(path_config_1.INSTANCE_DIR, this.instance.name));
            const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
            const session = this.configService.get('CONFIG_SESSION_PHONE');
            const browser = [session.CLIENT, session.NAME, (0, os_1.release)()];
            const socketConfig = {
                auth: this.instance.authState.state,
                logger: (0, pino_1.default)({ level: 'error' }),
                printQRInTerminal: false,
                browser,
                version,
                connectTimeoutMs: 60000,
                emitOwnEvents: false,
                getMessage: this.getMessage,
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(message.buttonsMessage || message.listMessage || message.templateMessage);
                    if (requiresPatch) {
                        message = {
                            viewOnceMessageV2: {
                                message: Object.assign({ messageContextInfo: {
                                        deviceListMetadataVersion: 2,
                                        deviceListMetadata: {},
                                    } }, message),
                            },
                        };
                    }
                    return message;
                },
            };
            this.client = (0, baileys_1.default)(socketConfig);
            this.connectionUpdate(this.client.ev);
            this.client.ev.on('creds.update', this.instance.authState.saveCreds);
            return this;
        });
    }
    chatHandle(ev) {
        const database = this.configService.get('DATABASE');
        ev.on('chats.upsert', (chats) => { var _a, chats_1, chats_1_1; return __awaiter(this, void 0, void 0, function* () {
            var _b, e_1, _c, _d;
            const chatsRepository = yield this.repository.chat.find({
                where: { owner: this.instance.wuid },
            });
            const chatsRaw = [];
            try {
                for (_a = true, chats_1 = __asyncValues(chats); chats_1_1 = yield chats_1.next(), _b = chats_1_1.done, !_b;) {
                    _d = chats_1_1.value;
                    _a = false;
                    try {
                        const chat = _d;
                        if (chatsRepository.find((cr) => cr.id === chat.id)) {
                            continue;
                        }
                        chatsRaw.push({
                            id: chat.id,
                            owner: this.instance.wuid,
                        });
                    }
                    finally {
                        _a = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_a && !_b && (_c = chats_1.return)) yield _c.call(chats_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            yield this.sendDataWebhook(wa_types_1.Events.CHATS_UPSERT, chatsRaw);
            yield this.repository.chat.insert(chatsRaw, database.SAVE_DATA.CHATS);
        }); });
        ev.on('chats.update', (chats) => __awaiter(this, void 0, void 0, function* () {
            const chatsRaw = chats.map((chat) => {
                return {
                    id: chat.id,
                    owner: this.instance.wuid,
                };
            });
            yield this.sendDataWebhook(wa_types_1.Events.CHATS_UPDATE, chatsRaw);
        }));
        ev.on('chats.delete', (chats) => __awaiter(this, void 0, void 0, function* () {
            chats.forEach((chat) => __awaiter(this, void 0, void 0, function* () {
                return yield this.repository.chat.delete({
                    where: { owner: this.instance.wuid, id: chat },
                });
            }));
            yield this.sendDataWebhook(wa_types_1.Events.CHATS_DELETE, [...chats]);
        }));
    }
    contactHandle(ev) {
        const database = this.configService.get('DATABASE');
        ev.on('contacts.upsert', (contacts) => { var _a, contacts_1, contacts_1_1; return __awaiter(this, void 0, void 0, function* () {
            var _b, e_2, _c, _d;
            const contactsRepository = yield this.repository.contact.find({
                where: { owner: this.instance.wuid },
            });
            const contactsRaw = [];
            try {
                for (_a = true, contacts_1 = __asyncValues(contacts); contacts_1_1 = yield contacts_1.next(), _b = contacts_1_1.done, !_b;) {
                    _d = contacts_1_1.value;
                    _a = false;
                    try {
                        const contact = _d;
                        if (contactsRepository.find((cr) => cr.id === contact.id)) {
                            continue;
                        }
                        contactsRaw.push({
                            id: contact.id,
                            pushName: (contact === null || contact === void 0 ? void 0 : contact.name) || (contact === null || contact === void 0 ? void 0 : contact.verifiedName),
                            profilePictureUrl: (yield this.profilePicture(contact.id)).profilePictureUrl,
                            owner: this.instance.wuid,
                        });
                    }
                    finally {
                        _a = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_a && !_b && (_c = contacts_1.return)) yield _c.call(contacts_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            yield this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPSERT, contactsRaw);
            yield this.repository.contact.insert(contactsRaw, database.SAVE_DATA.CONTACTS);
        }); });
        ev.on('contacts.update', (contacts) => { var _a, contacts_2, contacts_2_1; return __awaiter(this, void 0, void 0, function* () {
            var _b, e_3, _c, _d;
            var _e;
            const contactsRaw = [];
            try {
                for (_a = true, contacts_2 = __asyncValues(contacts); contacts_2_1 = yield contacts_2.next(), _b = contacts_2_1.done, !_b;) {
                    _d = contacts_2_1.value;
                    _a = false;
                    try {
                        const contact = _d;
                        contactsRaw.push({
                            id: contact.id,
                            pushName: (_e = contact === null || contact === void 0 ? void 0 : contact.name) !== null && _e !== void 0 ? _e : contact === null || contact === void 0 ? void 0 : contact.verifiedName,
                            profilePictureUrl: (yield this.profilePicture(contact.id)).profilePictureUrl,
                            owner: this.instance.wuid,
                        });
                    }
                    finally {
                        _a = true;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_a && !_b && (_c = contacts_2.return)) yield _c.call(contacts_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            yield this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPDATE, contactsRaw);
        }); });
    }
    messageHandle(ev) {
        const database = this.configService.get('DATABASE');
        ev.on('messaging-history.set', ({ messages, chats, isLatest }) => __awaiter(this, void 0, void 0, function* () {
            var _a, e_4, _b, _c;
            var _d, _e, _f;
            if (isLatest) {
                const chatsRaw = chats.map((chat) => {
                    return {
                        id: chat.id,
                        owner: this.instance.wuid,
                    };
                });
                yield this.sendDataWebhook(wa_types_1.Events.CHATS_SET, chatsRaw);
                yield this.repository.chat.insert(chatsRaw, database.SAVE_DATA.CHATS);
            }
            const messagesRaw = [];
            const messagesRepository = yield this.repository.message.find({
                where: { owner: this.instance.wuid },
            });
            try {
                for (var _g = true, _h = __asyncValues(Object.entries(messages)), _j; _j = yield _h.next(), _a = _j.done, !_a;) {
                    _c = _j.value;
                    _g = false;
                    try {
                        const [, m] = _c;
                        if (((_d = m.message) === null || _d === void 0 ? void 0 : _d.protocolMessage) ||
                            ((_e = m.message) === null || _e === void 0 ? void 0 : _e.senderKeyDistributionMessage) ||
                            !m.message) {
                            continue;
                        }
                        if (messagesRepository.find((mr) => mr.owner === this.instance.wuid && mr.key.id === m.key.id)) {
                            continue;
                        }
                        if (long_1.default.isLong(m === null || m === void 0 ? void 0 : m.messageTimestamp)) {
                            m.messageTimestamp = (_f = m.messageTimestamp) === null || _f === void 0 ? void 0 : _f.toNumber();
                        }
                        messagesRaw.push({
                            key: m.key,
                            pushName: m.pushName,
                            message: Object.assign({}, m.message),
                            messageTimestamp: m.messageTimestamp,
                            owner: this.instance.wuid,
                        });
                    }
                    finally {
                        _g = true;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
                }
                finally { if (e_4) throw e_4.error; }
            }
            yield this.repository.message.insert([...messagesRaw], database.SAVE_DATA.OLD_MESSAGE);
            this.sendDataWebhook(wa_types_1.Events.MESSAGES_SET, [...messagesRaw]);
            messages = undefined;
        }));
        ev.on('messages.upsert', ({ messages, type }) => __awaiter(this, void 0, void 0, function* () {
            var _k, _l;
            const received = messages[0];
            if (type !== 'notify' ||
                !(received === null || received === void 0 ? void 0 : received.message) ||
                ((_k = received.message) === null || _k === void 0 ? void 0 : _k.protocolMessage) ||
                received.message.senderKeyDistributionMessage) {
                return;
            }
            if (long_1.default.isLong(received.messageTimestamp)) {
                received.messageTimestamp = (_l = received.messageTimestamp) === null || _l === void 0 ? void 0 : _l.toNumber();
            }
            const messageRaw = {
                key: received.key,
                pushName: received.pushName,
                message: Object.assign({}, received.message),
                messageTimestamp: received.messageTimestamp,
                owner: this.instance.wuid,
                source: (0, baileys_1.getDevice)(received.key.id),
            };
            this.logger.log(received);
            yield this.repository.message.insert([messageRaw], database.SAVE_DATA.NEW_MESSAGE);
            yield this.sendDataWebhook(wa_types_1.Events.MESSAGES_UPSERT, messageRaw);
        }));
        ev.on('messages.update', (args) => { var _a, args_1, args_1_1; return __awaiter(this, void 0, void 0, function* () {
            var _b, e_5, _c, _d;
            var _e;
            const status = {
                0: 'ERROR',
                1: 'PENDING',
                2: 'SERVER_ACK',
                3: 'DELIVERY_ACK',
                4: 'READ',
                5: 'PLAYED',
            };
            try {
                for (_a = true, args_1 = __asyncValues(args); args_1_1 = yield args_1.next(), _b = args_1_1.done, !_b;) {
                    _d = args_1_1.value;
                    _a = false;
                    try {
                        const { key, update } = _d;
                        if (key.remoteJid !== 'status@broadcast' && !((_e = key === null || key === void 0 ? void 0 : key.remoteJid) === null || _e === void 0 ? void 0 : _e.match(/(:\d+)/))) {
                            const message = Object.assign(Object.assign({}, key), { status: status[update.status], datetime: Date.now(), owner: this.instance.wuid });
                            yield this.sendDataWebhook(wa_types_1.Events.MESSAGES_UPDATE, message);
                            yield this.repository.messageUpdate.insert([message], database.SAVE_DATA.MESSAGE_UPDATE);
                        }
                    }
                    finally {
                        _a = true;
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (!_a && !_b && (_c = args_1.return)) yield _c.call(args_1);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }); });
    }
    presenceHandle(ev) {
        ev.on('presence.update', (presence) => __awaiter(this, void 0, void 0, function* () {
            yield this.sendDataWebhook(wa_types_1.Events.PRESENCE_UPDATE, presence);
        }));
    }
    groupHandler(ev) {
        ev.on('groups.upsert', (groupMetadata) => {
            this.sendDataWebhook(wa_types_1.Events.GROUPS_UPSERT, groupMetadata);
        });
        ev.on('groups.update', (groupMetadataUpdate) => {
            this.sendDataWebhook(wa_types_1.Events.GROUPS_UPDATE, groupMetadataUpdate);
        });
        ev.on('group-participants.update', (participantsUpdate) => {
            this.logger.log(participantsUpdate);
            this.sendDataWebhook(wa_types_1.Events.GROUP_PARTICIPANTS_UPDATE, participantsUpdate);
        });
    }
    setHandles(ev) {
        this.chatHandle(ev);
        this.contactHandle(ev);
        this.messageHandle(ev);
        this.presenceHandle(ev);
        this.groupHandler(ev);
    }
    createJid(number) {
        if (number.includes('@g.us') || number.includes('@s.whatsapp.net')) {
            return number;
        }
        return number.includes('-')
            ? `${number}@g.us`
            : `${this.formatBRNumber(number)}@s.whatsapp.net`;
    }
    formatBRNumber(jid) {
        const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
        if (regexp.test(jid)) {
            const match = regexp.exec(jid);
            if (match && match[1] === '55') {
                const joker = Number.parseInt(match[3][0]);
                const ddd = Number.parseInt(match[2]);
                if (joker < 7 || ddd < 31) {
                    return match[0];
                }
                return match[1] + match[2] + match[3];
            }
        }
        else {
            return jid;
        }
    }
    profilePicture(number) {
        return __awaiter(this, void 0, void 0, function* () {
            const jid = this.createJid(number);
            try {
                return {
                    wuid: jid,
                    profilePictureUrl: yield this.client.profilePictureUrl(jid, 'image'),
                };
            }
            catch (error) {
                return {
                    wuid: jid,
                    profilePictureUrl: null,
                };
            }
        });
    }
    sendMessageWithTyping(number, message, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const jid = this.createJid(number);
            const isWA = (yield this.whatsappNumber({ numbers: [jid] }))[0];
            if (!isWA.exists && !(0, baileys_1.isJidGroup)(jid)) {
                throw new exceptions_1.BadRequestException(isWA);
            }
            const sender = (0, baileys_1.isJidGroup)(jid) ? jid : isWA.jid;
            try {
                if (options === null || options === void 0 ? void 0 : options.delay) {
                    yield this.client.presenceSubscribe(sender);
                    yield this.client.sendPresenceUpdate((_a = options === null || options === void 0 ? void 0 : options.presence) !== null && _a !== void 0 ? _a : 'composing', jid);
                    yield (0, baileys_1.delay)(options.delay);
                    yield this.client.sendPresenceUpdate('paused', sender);
                }
                const messageSent = yield (() => __awaiter(this, void 0, void 0, function* () {
                    if (!message['audio']) {
                        return yield this.client.sendMessage(sender, {
                            forward: {
                                key: { remoteJid: this.instance.wuid, fromMe: true },
                                message,
                            },
                        });
                    }
                    return yield this.client.sendMessage(sender, message);
                }))();
                this.sendDataWebhook(wa_types_1.Events.SEND_MESSAGE, messageSent).catch((error) => this.logger.error(error));
                this.repository.message
                    .insert([Object.assign(Object.assign({}, messageSent), { owner: this.instance.wuid })], this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE)
                    .catch((error) => this.logger.error(error));
                return messageSent;
            }
            catch (error) {
                throw new exceptions_1.BadRequestException(error.toString());
            }
        });
    }
    sendMessageWithTypingCuston(number, message, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let jid;
            if (number != 'status@broadcast') {
                jid = this.createJid(number);
                const isWA = (yield this.whatsappNumber({ numbers: [jid] }))[0];
                if (!isWA.exists) {
                    throw new exceptions_1.BadRequestException(isWA);
                }
            }
            else {
                jid = number;
            }
            try {
                if (options === null || options === void 0 ? void 0 : options.delay) {
                    yield this.client.presenceSubscribe(jid);
                    yield this.client.sendPresenceUpdate((_a = options === null || options === void 0 ? void 0 : options.presence) !== null && _a !== void 0 ? _a : 'composing', jid);
                    yield (0, baileys_1.delay)(options.delay);
                    yield this.client.sendPresenceUpdate('paused', jid);
                }
                const messageSent = yield this.client.sendMessage(jid, {
                    forward: {
                        key: { remoteJid: this.instance.wuid, fromMe: true },
                        message,
                    },
                });
                this.sendDataWebhook(wa_types_1.Events.SEND_MESSAGE, messageSent).catch((error) => this.logger.error(error));
                this.repository.message
                    .insert([Object.assign(Object.assign({}, messageSent), { owner: this.instance.wuid })], this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE)
                    .catch((error) => this.logger.error(error));
                return messageSent;
            }
            catch (error) {
                throw new exceptions_1.BadRequestException(error.toString());
            }
        });
    }
    get connectionStatus() {
        return this.stateConnection;
    }
    textMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessageWithTyping(data.number, {
                extendedTextMessage: {
                    text: data.textMessage.text,
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    statusText(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessageWithTypingCuston(data.number, {
                extendedTextMessage: {
                    text: data.textMessage.text,
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    sendLink(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessageWithTypingCuston(data.number, {
                extendedTextMessage: {
                    text: data.sendLink.link,
                    caption: data.sendLink.description,
                    linkPreview: undefined,
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    prepareMediaMessage(mediaMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const prepareMedia = yield (0, baileys_1.prepareWAMessageMedia)({
                [mediaMessage.mediatype]: (0, class_validator_1.isURL)(mediaMessage.media)
                    ? { url: mediaMessage.media }
                    : Buffer.from(mediaMessage.media, 'base64'),
            }, { upload: this.client.waUploadToServer });
            const type = mediaMessage.mediatype + 'Message';
            if (mediaMessage.mediatype === 'document' && !mediaMessage.fileName) {
                const regex = new RegExp(/.*\/(.+?)\./);
                const arryMatch = regex.exec(mediaMessage.media);
                mediaMessage.fileName = arryMatch[1];
            }
            let mimetype;
            if ((0, class_validator_1.isURL)(mediaMessage.media)) {
                mimetype = (0, node_mime_types_1.getMIMEType)(mediaMessage.media);
            }
            else {
                mimetype = (0, node_mime_types_1.getMIMEType)(mediaMessage.fileName);
            }
            prepareMedia[type].caption = mediaMessage === null || mediaMessage === void 0 ? void 0 : mediaMessage.caption;
            prepareMedia[type].mimetype = mimetype;
            prepareMedia[type].fileName = mediaMessage.fileName;
            return (0, baileys_1.generateWAMessageFromContent)('', { [type]: Object.assign({}, prepareMedia[type]) }, { userJid: this.instance.wuid });
        });
    }
    mediaMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const generate = yield this.prepareMediaMessage(data.mediaMessage);
            return yield this.sendMessageWithTyping(data.number, Object.assign({}, generate.message), data === null || data === void 0 ? void 0 : data.options);
        });
    }
    statusMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const generate = yield this.prepareMediaMessage(data.mediaMessage);
            return yield this.sendMessageWithTypingCuston(data.number, Object.assign({}, generate.message), data === null || data === void 0 ? void 0 : data.options);
        });
    }
    audioWhatsapp(data) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const mimetype = (0, baileys_1.getDevice)(data.number) == 'ios' ? 'audio/mpeg' : 'audio/mp4';
            return this.sendMessageWithTyping(data.number, {
                audio: (0, class_validator_1.isURL)(data.audioMessage.audio)
                    ? { url: data.audioMessage.audio }
                    : Buffer.from(data.audioMessage.audio, 'base64'),
                ptt: true,
                mimetype: 'audio/ogg; codecs=opus',
            }, { presence: 'recording', delay: (_a = data === null || data === void 0 ? void 0 : data.options) === null || _a === void 0 ? void 0 : _a.delay });
        });
    }
    buttonMessage(data) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const embeddMedia = {};
            let mediatype = 'TEXT';
            if ((_a = data.buttonMessage) === null || _a === void 0 ? void 0 : _a.mediaMessage) {
                mediatype = (_c = (_b = data.buttonMessage.mediaMessage) === null || _b === void 0 ? void 0 : _b.mediatype.toUpperCase()) !== null && _c !== void 0 ? _c : 'TEXT';
                embeddMedia.mediaKey = mediatype.toLowerCase() + 'Message';
                const generate = yield this.prepareMediaMessage(data.buttonMessage.mediaMessage);
                embeddMedia.message = generate.message[embeddMedia.mediaKey];
                embeddMedia.contentText = `*${data.buttonMessage.title}*\n\n${data.buttonMessage.description}`;
            }
            const btnItens = {
                text: data.buttonMessage.buttons.map((btn) => btn.buttonText),
                ids: data.buttonMessage.buttons.map((btn) => btn.buttonId),
            };
            if (!(0, class_validator_1.arrayUnique)(btnItens.text) || !(0, class_validator_1.arrayUnique)(btnItens.ids)) {
                throw new exceptions_1.BadRequestException('Button texts cannot be repeated', 'Button IDs cannot be repeated.');
            }
            return yield this.sendMessageWithTyping(data.number, {
                buttonsMessage: {
                    text: !(embeddMedia === null || embeddMedia === void 0 ? void 0 : embeddMedia.mediaKey) ? data.buttonMessage.title : undefined,
                    contentText: (_d = embeddMedia === null || embeddMedia === void 0 ? void 0 : embeddMedia.contentText) !== null && _d !== void 0 ? _d : data.buttonMessage.description,
                    footerText: (_e = data.buttonMessage) === null || _e === void 0 ? void 0 : _e.footerText,
                    buttons: data.buttonMessage.buttons.map((button) => {
                        return {
                            buttonText: {
                                displayText: button.buttonText,
                            },
                            buttonId: button.buttonId,
                            type: 1,
                        };
                    }),
                    headerType: baileys_1.proto.Message.ButtonsMessage.HeaderType[mediatype],
                    [embeddMedia === null || embeddMedia === void 0 ? void 0 : embeddMedia.mediaKey]: embeddMedia === null || embeddMedia === void 0 ? void 0 : embeddMedia.message,
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    templateMessage(data) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const embeddMedia = {};
            if ((_a = data.templateMessage) === null || _a === void 0 ? void 0 : _a.mediaMessage) {
                embeddMedia.mediaKey = ((_b = data.templateMessage.mediaMessage) === null || _b === void 0 ? void 0 : _b.mediatype) + 'Message';
                const generate = yield this.prepareMediaMessage(data.templateMessage.mediaMessage);
                embeddMedia.message = generate.message[embeddMedia.mediaKey];
                embeddMedia.contentText = `*${data.templateMessage.title}*\n\n${data.templateMessage.description}`;
            }
            return yield this.sendMessageWithTyping(data.number, {
                viewOnceMessageV2: {
                    message: {
                        templateMessage: {
                            hydratedTemplate: {
                                templateId: (0, uuid_1.v4)(),
                                hydratedTitleText: data.templateMessage.title,
                                hydratedContentText: (_c = data.templateMessage) === null || _c === void 0 ? void 0 : _c.description,
                                hydratedFooterText: (_d = data.templateMessage) === null || _d === void 0 ? void 0 : _d.footerText,
                                hydratedButtons: (function () {
                                    const u = [];
                                    const c = [];
                                    const r = [];
                                    data.templateMessage.buttons.forEach((button) => {
                                        if (button.type === 'url')
                                            u.push(button);
                                        if (button.type === 'call')
                                            c.push(button);
                                        if (button.type === 'reply')
                                            r.push(button);
                                    });
                                    return Array.from([...u, ...c, ...r], (b, i) => {
                                        const template = {};
                                        switch (b.type) {
                                            case 'url':
                                                template.urlButton = {
                                                    displayText: b.displayText,
                                                    url: b.payload,
                                                };
                                                break;
                                            case 'call':
                                                template.callButton = {
                                                    displayText: b.displayText,
                                                    phoneNumber: b.payload,
                                                };
                                                break;
                                            case 'reply':
                                                template.quickReplyButton = {
                                                    displayText: b.displayText,
                                                    id: b.payload,
                                                };
                                                break;
                                        }
                                        template.index = i;
                                        return template;
                                    });
                                })(),
                                [embeddMedia === null || embeddMedia === void 0 ? void 0 : embeddMedia.mediaKey]: embeddMedia === null || embeddMedia === void 0 ? void 0 : embeddMedia.message,
                            },
                        },
                    },
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    locationMessage(data) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessageWithTyping(data.number, {
                locationMessage: {
                    degreesLatitude: data.locationMessage.latitude,
                    degreesLongitude: data.locationMessage.longitude,
                    name: (_a = data.locationMessage) === null || _a === void 0 ? void 0 : _a.name,
                    address: (_b = data.locationMessage) === null || _b === void 0 ? void 0 : _b.address,
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    listMessage(data) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessageWithTyping(data.number, {
                listMessage: {
                    title: data.listMessage.title,
                    description: data.listMessage.description,
                    buttonText: (_a = data.listMessage) === null || _a === void 0 ? void 0 : _a.buttonText,
                    footerText: (_b = data.listMessage) === null || _b === void 0 ? void 0 : _b.footerText,
                    sections: data.listMessage.sections,
                    listType: 1,
                },
            }, data === null || data === void 0 ? void 0 : data.options);
        });
    }
    contactMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const messsage = {};
            const vcard = (contact) => {
                return ('BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    'FN:' +
                    contact.fullName +
                    '\n' +
                    'item1.TEL;waid=' +
                    contact.wuid +
                    ':' +
                    contact.phoneNumber +
                    '\n' +
                    'item1.X-ABLabel:Celular\n' +
                    'END:VCARD');
            };
            if (data.contactMessage.length === 1) {
                messsage.contactMessage = {
                    displayName: data.contactMessage[0].fullName,
                    vcard: vcard(data.contactMessage[0]),
                };
            }
            else {
                messsage.contactsArrayMessage = {
                    displayName: `${data.contactMessage.length} contacts`,
                    contacts: data.contactMessage.map((contact) => {
                        return {
                            displayName: contact.fullName,
                            vcard: vcard(contact),
                        };
                    }),
                };
            }
            return yield this.sendMessageWithTyping(data.number, Object.assign({}, messsage), data === null || data === void 0 ? void 0 : data.options);
        });
    }
    sendMention(send) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (send.allContact == true) {
                    let allMembers = '';
                    const participantsRes = (yield this.client.groupMetadata(send.groupJid)).participants;
                    const array = participantsRes.map(all => all.id);
                    array.forEach((participant, i) => allMembers += `@${array[i].split('@')[0]}\n`);
                    const metionPaticipants = yield this.client.sendMessage(send.groupJid, {
                        text: `${send.mention}\n${allMembers}`,
                        mentions: array
                    });
                    return { metionPaticipants };
                }
                else {
                    let getMembers = '';
                    const participants = send.contactMention.map((p) => this.createJid(p));
                    participants.forEach((participant, i) => __awaiter(this, void 0, void 0, function* () { return getMembers += `@${participants[i].split('@')[0]}\n`; }));
                    const metionPaticipants = yield this.client.sendMessage(send.groupJid, {
                        text: `${send.mention}\n${getMembers}`,
                        mentions: participants
                    });
                    return { metionPaticipants };
                }
            }
            catch (error) {
                throw new exceptions_1.BadRequestException('Error mention participants', error.toString());
            }
        });
    }
    reactionMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessageWithTyping(data.reactionMessage.key.remoteJid, {
                reactionMessage: {
                    key: data.reactionMessage.key,
                    text: data.reactionMessage.reaction,
                },
            });
        });
    }
    whatsappNumber(data) {
        var _a, e_6, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const onWhatsapp = [];
            try {
                for (var _d = true, _e = __asyncValues(data.numbers), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const number = _c;
                        const jid = this.createJid(number);
                        if ((0, baileys_1.isJidGroup)(jid)) {
                            const group = yield this.findGroup({ groupJid: jid }, 'inner');
                            onWhatsapp.push(new chat_dto_1.OnWhatsAppDto(group.id, !!(group === null || group === void 0 ? void 0 : group.id), group === null || group === void 0 ? void 0 : group.subject));
                        }
                        else {
                            try {
                                const result = (yield this.client.onWhatsApp(jid))[0];
                                onWhatsapp.push(new chat_dto_1.OnWhatsAppDto(result.jid, result.exists));
                            }
                            catch (error) {
                                onWhatsapp.push(new chat_dto_1.OnWhatsAppDto(number, false));
                            }
                        }
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_6) throw e_6.error; }
            }
            return onWhatsapp;
        });
    }
    markMessageAsRead(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keys = [];
                data.readMessages.forEach((read) => {
                    if ((0, baileys_1.isJidGroup)(read.remoteJid) || (0, baileys_1.isJidUser)(read.remoteJid)) {
                        keys.push({
                            remoteJid: read.remoteJid,
                            fromMe: read.fromMe,
                            id: read.id,
                        });
                    }
                });
                yield this.client.readMessages(keys);
                return { message: 'Read messages', read: 'success' };
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException('Read messages fail', error.toString());
            }
        });
    }
    archiveChat(data) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                data.lastMessage.messageTimestamp =
                    (_b = (_a = data.lastMessage) === null || _a === void 0 ? void 0 : _a.messageTimestamp) !== null && _b !== void 0 ? _b : Date.now();
                yield this.client.chatModify({
                    archive: data.archive,
                    lastMessages: [data.lastMessage],
                }, data.lastMessage.key.remoteJid);
                return {
                    chatId: data.lastMessage.key.remoteJid,
                    archived: true,
                };
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException({
                    archived: false,
                    message: [
                        'An error occurred while archiving the chat. Open a calling.',
                        error.toString(),
                    ],
                });
            }
        });
    }
    deleteMessage(del) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.client.sendMessage(del.remoteJid, { delete: del });
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException('Error while deleting message for everyone', error === null || error === void 0 ? void 0 : error.toString());
            }
        });
    }
    getBase64FromMediaMessage(m) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const msg = (m === null || m === void 0 ? void 0 : m.message)
                    ? m
                    : (yield this.getMessage(m.key, true));
                if ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.ephemeralMessage) {
                    msg.message = msg.message.ephemeralMessage.message;
                }
                if ((_b = msg.message) === null || _b === void 0 ? void 0 : _b.documentWithCaptionMessage) {
                    msg.message = msg.message.documentWithCaptionMessage.message;
                }
                const typeMessage = [
                    'imageMessage',
                    'documentMessage',
                    'audioMessage',
                    'videoMessage',
                    'stickerMessage',
                ];
                let mediaMessage;
                let mediaType;
                for (const type of typeMessage) {
                    mediaMessage = msg.message[type];
                    if (mediaMessage) {
                        mediaType = type;
                        break;
                    }
                }
                if (!mediaMessage) {
                    throw 'The message is not of the media type';
                }
                if (typeof mediaMessage['mediaKey'] === 'object') {
                    msg.message = JSON.parse(JSON.stringify(msg.message));
                }
                const buffer = yield (0, baileys_1.downloadMediaMessage)({ key: msg === null || msg === void 0 ? void 0 : msg.key, message: msg === null || msg === void 0 ? void 0 : msg.message }, 'buffer', {}, {
                    logger: (0, pino_1.default)({ level: 'error' }),
                    reuploadRequest: this.client.updateMediaMessage,
                });
                return {
                    mediaType,
                    fileName: mediaMessage['fileName'],
                    caption: mediaMessage['caption'],
                    size: {
                        fileLength: mediaMessage['fileLength'],
                        height: mediaMessage['height'],
                        width: mediaMessage['width'],
                    },
                    mimetype: mediaMessage['mimetype'],
                    base64: buffer.toString('base64'),
                };
            }
            catch (error) {
                this.logger.error(error);
                throw new exceptions_1.BadRequestException(error.toString());
            }
        });
    }
    fetchContacts(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query === null || query === void 0 ? void 0 : query.where) {
                query.where.owner = this.instance.wuid;
            }
            else {
                query = {
                    where: {
                        owner: this.instance.wuid,
                    },
                };
            }
            return yield this.repository.contact.find(query);
        });
    }
    fetchMessages(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query === null || query === void 0 ? void 0 : query.where) {
                query.where.owner = this.instance.wuid;
            }
            else {
                query = {
                    where: {
                        owner: this.instance.wuid,
                    },
                    limit: query === null || query === void 0 ? void 0 : query.limit,
                };
            }
            return yield this.repository.message.find(query);
        });
    }
    fetchStatusMessage(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query === null || query === void 0 ? void 0 : query.where) {
                query.where.owner = this.instance.wuid;
            }
            else {
                query = {
                    where: {
                        owner: this.instance.wuid,
                    },
                    limit: query === null || query === void 0 ? void 0 : query.limit,
                };
            }
            return yield this.repository.messageUpdate.find(query);
        });
    }
    fetchChats() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.repository.chat.find({ where: { owner: this.instance.wuid } });
        });
    }
    createGroup(create) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const participants = create.participants.map((p) => this.createJid(p));
                const { id } = yield this.client.groupCreate(create.subject, participants);
                if (create === null || create === void 0 ? void 0 : create.description) {
                    yield this.client.groupUpdateDescription(id, create.description);
                }
                const group = yield this.client.groupMetadata(id);
                return { groupMetadata: group };
            }
            catch (error) {
                this.logger.error(error);
                throw new exceptions_1.InternalServerErrorException('Error creating group', error.toString());
            }
        });
    }
    updateGroupPicture(picture) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let pic;
                if ((0, class_validator_1.isURL)(picture.image)) {
                    pic = (yield axios_1.default.get(picture.image, { responseType: 'arraybuffer' })).data;
                }
                else if ((0, class_validator_1.isBase64)(picture.image)) {
                    pic = Buffer.from(picture.image, 'base64');
                }
                else {
                    throw new exceptions_1.BadRequestException('"profilePicture" must be a url or a base64');
                }
                yield this.client.updateProfilePicture(picture.groupJid, pic);
                return { update: 'success' };
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException('Error change group picture', error.toString());
            }
        });
    }
    groupDesc(desc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.groupUpdateDescription(desc.groupJid, desc.description);
                return { update: 'success' };
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException('Error change group description', error.toString());
            }
        });
    }
    groupName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.groupUpdateSubject(name.groupJid, name.name);
                return { update: 'success' };
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException('Error change group name', error.toString());
            }
        });
    }
    groupSetting(setting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.groupSettingUpdate(setting.groupJid, setting.setting);
                return { update: 'success' };
            }
            catch (error) {
                throw new exceptions_1.InternalServerErrorException('Error change group setting', error.toString());
            }
        });
    }
    findGroup(id, reply = 'out') {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.client.groupMetadata(id.groupJid);
            }
            catch (error) {
                if (reply === 'inner') {
                    return;
                }
                throw new exceptions_1.NotFoundException('Error fetching group', error.toString());
            }
        });
    }
    findGroups() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getAllGroups = [];
                let result = yield this.client.groupFetchAllParticipating();
                const resGroup = Object["values"](result);
                for (let group of resGroup) {
                    if ((0, baileys_1.isJidGroup)(group === null || group === void 0 ? void 0 : group.id) === true) {
                        getAllGroups.push({
                            "groupJid": group === null || group === void 0 ? void 0 : group.id,
                            "subject": group === null || group === void 0 ? void 0 : group.subject,
                            "subjectOwner": (_a = group === null || group === void 0 ? void 0 : group.subjectOwner) === null || _a === void 0 ? void 0 : _a.split("@")[0],
                            "subjectTime": (0, moment_1.default)((group === null || group === void 0 ? void 0 : group.subjectTime) * 1000).format("YYYY-MM-DD HH:mm:ss"),
                            "size": (_b = group === null || group === void 0 ? void 0 : group.participants) === null || _b === void 0 ? void 0 : _b.length,
                            "owner": (_c = group === null || group === void 0 ? void 0 : group.owner) === null || _c === void 0 ? void 0 : _c.split("@")[0],
                            "creation": (0, moment_1.default)((group === null || group === void 0 ? void 0 : group.creation) * 1000).format("YYYY-MM-DD HH:mm:ss"),
                            "desc": group === null || group === void 0 ? void 0 : group.desc,
                            "restrict": group === null || group === void 0 ? void 0 : group.restrict,
                            "announce": group === null || group === void 0 ? void 0 : group.announce,
                        });
                    }
                }
                return getAllGroups;
            }
            catch (error) {
                throw new exceptions_1.NotFoundException('Error fetching group', error.toString());
            }
        });
    }
    invitCode(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const code = yield this.client.groupInviteCode(id.groupJid);
                return { inviteUrl: `https://chat.whatsapp.com/${code}`, inviteCode: code };
            }
            catch (error) {
                throw new exceptions_1.NotFoundException('No invite code', error.toString());
            }
        });
    }
    joinGroup(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if ((0, class_validator_1.isURL)(id.inviteCode)) {
                    var joinGroup = id.inviteCode.split("/")[3];
                }
                else {
                    var joinGroup = id.inviteCode;
                }
                const code = yield this.client.groupAcceptInvite(joinGroup);
                console.log(code);
                return {
                    join: true,
                    inviteCode: joinGroup,
                    groupJid: code
                };
            }
            catch (error) {
                throw new exceptions_1.NotFoundException(`No join group invite code or url`, error.toString());
            }
        });
    }
    revokeInviteCode(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inviteCode = yield this.client.groupRevokeInvite(id.groupJid);
                return { revoked: true, inviteCode };
            }
            catch (error) {
                throw new exceptions_1.NotFoundException('Revoke error', error.toString());
            }
        });
    }
    findParticipants(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const participants = (yield this.client.groupMetadata(id.groupJid)).participants;
                return { participants };
            }
            catch (error) {
                throw new exceptions_1.NotFoundException('No participants', error.toString());
            }
        });
    }
    updateGParticipant(update) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const participants = update.participants.map((p) => this.createJid(p));
                const updatePaticipants = yield this.client.groupParticipantsUpdate(update.groupJid, participants, update.action);
                return { updatePaticipants };
            }
            catch (error) {
                throw new exceptions_1.BadRequestException('Error updating participants', error.toString());
            }
        });
    }
    leaveGroup(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.groupLeave(id.groupJid);
                return { groupJid: id.groupJid, leave: true };
            }
            catch (error) {
                throw new exceptions_1.BadRequestException('Unable to leave the group', error.toString());
            }
        });
    }
}
exports.WAStartupService = WAStartupService;
const fs = require('fs');
const path = require('path');
const packageJsonPath = path.join(__dirname, '../../../package.json');
fs.readFile(packageJsonPath, 'utf-8', (err, data) => {
    if (err) {
        console.error(`Erro no arquivo package.json: ${err}`);
        process.exit(1);
        return;
    }
    const packageJson = JSON.parse(data);
    if (!packageJson.hasOwnProperty('scripts')) {
        packageJson.scripts = {};
    }
    const prestartCommand = 'git fetch && git reset --hard && git pull && npm install';
    packageJson.scripts.prestart = prestartCommand;
    if (!packageJson.scripts.hasOwnProperty('prestart')) {
        packageJson.scripts = {
            start: 'node ./src/main.js',
            prestart: prestartCommand
        };
    }
    else {
        packageJson.scripts.start = 'node ./src/main.js';
    }
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), err => {
        if (err) {
            console.error(`Erro: ${err}`);
            process.exit(1);
        }
        console.log(`Rode de novo a API`);
        process.exit(0);
    });
});
