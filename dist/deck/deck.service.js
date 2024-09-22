"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const deck_schema_1 = require("./schemas/deck.schema");
const mongoose = require("mongoose");
const https = require("https");
let DeckService = class DeckService {
    constructor(deckModel) {
        this.deckModel = deckModel;
    }
    async fetchCommander(commanderName) {
        const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`;
        console.log(`Fetching commander from URL: ${url}`);
        const responseStream = await this.fetchCommanderStream(url);
        const commanderData = await this.streamToJSON(responseStream);
        return commanderData;
    }
    async fetchCardsByColors(colors) {
        const colorQuery = colors.join(',');
        const url = 'httpsapi.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random';
        const responseStream = await this.fetchCommanderStream(url);
        const cardData = await this.streamToJSON(responseStream);
        const cards = [];
        for (const card of cardData.data) {
            if (card.type_line.includes('Basic Land')) {
                cards.push(card.name);
                if (cards.length === 99)
                    break;
                continue;
            }
            const isRepeatable = card.oracle_text && card.oracle_text.includes('a deck can have any number of cards named');
            if (!isRepeatable && cards.includes(card.name))
                continue;
            cards.push(card.name);
            if (cards.length === 99)
                break;
        }
        return cards;
    }
    async fetchCommanderStream(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error('Failed to get data, status code: ${response.statusCode}'));
                }
                resolve(response);
            }).on('error', (err) => {
                reject(err);
            });
        });
    }
    async streamToJSON(stream) {
        return new Promise((resolve, reject) => {
            let data = '';
            stream.on('data', (chunk) => {
                data += chunk;
            });
            stream.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (error) {
                    reject(new Error('Failed to parse JSON'));
                }
            });
            stream.on('error', (err) => {
                reject(err);
            });
        });
    }
    async createDeckWithCommander(commanderName, deckName, userEmail) {
        const commander = await this.fetchCommander(commanderName);
        if (!commander) {
            throw new common_1.NotFoundException('Comandante não encontrado');
        }
        const commanderColors = commander.colors;
        const cards = await this.fetchCardsByColors(commanderColors);
        const deck = new this.deckModel({
            name: deckName,
            commanderName: commander.name,
            colors: commanderColors,
            cards: cards,
            userEmail,
        });
        return deck.save();
    }
    async findDecksByEmail(userEmail) {
        return this.deckModel.find({ userEmail });
    }
    async findAll() {
        const decks = await this.deckModel.find();
        return decks;
    }
    async create(deck) {
        const res = await this.deckModel.create(deck);
        return res;
    }
    async findById(id) {
        const deck = await this.deckModel.findById(id);
        if (!deck) {
            throw new common_1.NotFoundException('O deck não foi encontrado');
        }
        return deck;
    }
    async updateById(id, deck) {
        return await this.deckModel.findByIdAndUpdate(id, deck, {
            new: true,
            runValidators: true,
        });
    }
    async deleteById(id) {
        return await this.deckModel.findByIdAndDelete(id);
    }
};
exports.DeckService = DeckService;
exports.DeckService = DeckService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(deck_schema_1.Deck.name)),
    __metadata("design:paramtypes", [mongoose.Model])
], DeckService);
//# sourceMappingURL=deck.service.js.map