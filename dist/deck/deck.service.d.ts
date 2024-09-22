import { Deck } from './schemas/deck.schema';
import * as mongoose from 'mongoose';
import { Readable } from 'stream';
export declare class DeckService {
    private deckModel;
    constructor(deckModel: mongoose.Model<Deck>);
    fetchCommander(commanderName: string): Promise<any>;
    fetchCardsByColors(colors: string[]): Promise<string[]>;
    fetchCommanderStream(url: string): Promise<Readable>;
    streamToJSON(stream: Readable): Promise<any>;
    createDeckWithCommander(commanderName: string, deckName: string, userEmail: string): Promise<Deck>;
    findDecksByEmail(userEmail: string): Promise<Deck[]>;
    findAll(): Promise<Deck[]>;
    create(deck: Deck): Promise<Deck>;
    findById(id: string): Promise<Deck>;
    updateById(id: string, deck: Deck): Promise<Deck>;
    deleteById(id: string): Promise<Deck>;
}
