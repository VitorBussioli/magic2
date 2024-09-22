import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Deck } from './schemas/deck.schema';
import * as mongoose from 'mongoose';
import { Readable } from 'stream';
import * as https from 'https';
import { resolve } from 'path';
import { rejects } from 'assert';
import { response } from 'express';

@Injectable()
export class DeckService {

    constructor(
      @InjectModel(Deck.name)
      private deckModel: mongoose.Model<Deck>
    ) {}

    async fetchCommander(commanderName: string): Promise<any> {
      const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`;
      console.log(`Fetching commander from URL: ${url}`);
      const responseStream = await this.fetchCommanderStream(url);

      const commanderData = await this.streamToJSON(responseStream);
      return commanderData;      
      //antes de implementar stream
      //const response = await fetch(url);
      //const data = await response.json();
      
      //console.log('Response from Scryfall API:', data);
      //return data;
  }


  async fetchCardsByColors(colors: string[]): Promise<string[]> {
    const colorQuery = colors.join(',');
    const url = 'httpsapi.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random';
    const responseStream = await this.fetchCommanderStream(url);
    const cardData = await this.streamToJSON(responseStream);

    const cards: string[] = [];
    for (const card of cardData.data) {
      if (card.type_line.includes('Basic Land')) {
        cards.push(card.name);
        if (cards.length === 99) break;
        continue
      }
      const isRepeatable = card.oracle_text && card.oracle_text.includes('a deck can have any number of cards named');
      if (!isRepeatable && cards.includes(card.name)) continue;

      cards.push(card.name);
      if (cards.length === 99) break;
    }
    return cards;
  }
    //const response = await fetch(`://httpsapi.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random`);
    //const data = await response.json();

    //const cards: string[] = [];

    //for (const card of data.data) {
       
    //    if (card.type_line.includes('Basic Land')) {
           
    //        cards.push(card.name);
    //        if (cards.length === 99) break;
    //        continue;
    //    }

      
        //const isRepeatable = card.oracle_text && card.oracle_text.includes('A deck can have any number of cards named');
        //if (!isRepeatable && cards.includes(card.name)) continue;

     
        //cards.push(card.name);
        //if (cards.length === 99) break;
    //}

    //return cards;
   //}

  async fetchCommanderStream(url: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error('Failed to get data, status code: ${response.statusCode}'))
        }
        resolve(response);
      }).on('error', (err) => {
          reject(err);
      });
    });
  }
  
   async streamToJSON(stream: Readable): Promise<any> {
      return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', (chunk) => {
          data += chunk;
        });
        stream.on('end', () =>{
          try {
            resolve(JSON.parse(data));
          } catch (error) {
              reject(new Error('Failed to parse JSON'));
          }
        });
        stream.on('error', (err) =>{
          reject(err);
        });
      });
  }
  
  async createDeckWithCommander(commanderName: string, deckName: string, userEmail: string): Promise<Deck> {
   
    const commander = await this.fetchCommander(commanderName);

    if (!commander) {
        throw new NotFoundException('Comandante não encontrado');
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

   ////////////////////////////////////////////////////////////////////////////////


    async findDecksByEmail(userEmail: string): Promise<Deck[]>{
      return this.deckModel.find({ userEmail });
    }


   ////////////////////////////////////////////////////////////////////////////////


    async findAll(): Promise<Deck[]> {
        const decks = await this.deckModel.find();
        return decks;
    }

    async create(deck: Deck): Promise<Deck> {
      const res = await this.deckModel.create(deck);
      return res;
    }

    async findById(id: string): Promise<Deck> {
      const deck = await this.deckModel.findById(id);

      if(!deck){
        throw new NotFoundException('O deck não foi encontrado');
      }

      return deck;
    }

    async updateById(id: string, deck: Deck): Promise<Deck> {
      return await this.deckModel.findByIdAndUpdate(id, deck, {
         new: true,
         runValidators: true,
      });
    }

    async deleteById(id: string): Promise<Deck> {
        return await this.deckModel.findByIdAndDelete(id);
    }

  
}


