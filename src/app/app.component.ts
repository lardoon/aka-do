import {Component, ViewChild} from '@angular/core';

import {MatTable} from '@angular/material/table';
import { CdkColumnDef } from '@angular/cdk/table';

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';

import { saveAs } from 'file-saver';

import * as _ from "lodash";

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {

 
  @ViewChild(MatTable) table: MatTable<any>;

  gamesToPlayEach = 6;
  playersPerGame = 3;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  players = [
    'Aka: Law',
    'Roderic: Mounts',
    'Pancetta: Chaos',
    'Bos5k: Armory',
    'Eidolon: Air',
    'Ruludos: Neutral',
    'Eth: Creatures',
    'Biscuits: Growths',
    'Mazy: Marksman',
    'Iod: Undead',
    'Lardon: Attack',
    'Clef: Speed'
  ]

  playersLeftOver: Array<string> = [];

  displayedColumns = []
  dataSource : Array<Object> = [];
  doingThing = false;

  highlight = '';
  stickyHighlight = false;

  // if clicked, stick the highlight to the clicked
  // player
  playerClick(player:string) {
    if(this.stickyHighlight) {
      this.stickyHighlight = false;
      this.notHovering();
    } else {
      this.hovering(player);
      this.stickyHighlight = true;
    }
  }

  // record which player is currently being hovered
  // over so we can highlight all instances
  hovering(player: string) {
    if(!this.stickyHighlight)
      this.highlight = player;
  }

  // clear any hover data set in hovering()
  notHovering() {
    if(!this.stickyHighlight)
      this.highlight = '';
  }

  ngOnInit() {
        
  }

  exportToCsv() {
    let headers = this.displayedColumns.slice(1); // don't want nudge columns
    let dataSource = <Array<any>> this.table.dataSource;
    let data = dataSource.map(g => {
      // slice 1 to remove gamesToPlayEach property
      return Object.values(g).slice(1).join(',');
    });
    let result = new Blob([[headers.join(','), data.join('\n')].join('\n')]);

    saveAs(result, 'export.csv');
  }

  doThisThing() {
    // simple flag to prevent running this function more than once
    // at any given time
    if(this.doingThing)
      return;
    this.doingThing = true;

    // we always want these first columns
    this.displayedColumns = ['nudge','game','player1','player2'];

    // add other player columns as necessary
    for(let c = 3; c <= this.playersPerGame; c++) {
      this.displayedColumns.push(`player${c}`)
    }
    this.playersLeftOver = [];
    let norberts: { [key:string]: number } = {};
    this.dataSource = [];
    this.players.forEach((p , i) => {
      // construct a list with players and the number of games
      // to which they can be allocated
      norberts[p] = this.gamesToPlayEach;
    })
    let gameid = 1;

    // keep track of whether there are any games still to allocate
    // and we'll keep going until none left to allocate
    let gamesToGo = this.gamesToGoCount(norberts);
    while(gamesToGo !== 0) {

      // if we have some players left but not enough to make up a game
      // we'll report it and end the process
      if(Object.keys(norberts).length < this.playersPerGame) {
        // this might happen depending on no of players
        // and playersPerGame game values
        this.playersLeftOver = Object.keys(norberts);
        break;
      }

      // get the top players with the most games that still need to be allocated
      let herberts = this.nextPlayers(norberts);
      let game = {
        playersPerGame: this.playersPerGame, // keep hold of this value in case we need it later
        no: gameid,
        // player1, player2 added here etc
      }
      gameid++;
      for(let p = 0; p < herberts.length; p++) {
        let herbert = herberts[p];
        game[`player${p + 1}`] = herbert;
        // one less game for this player to be allocated to
        norberts[herbert]--;
        // if we have no more games to allocate for this player
        // remove them from the list
        if(norberts[herbert] === 0)
          delete norberts[herbert];
      }
      
      // add this game to the table
      this.dataSource.push(game);

      gamesToGo = this.gamesToGoCount(norberts)
    }
    
    // redraw the table with the new data
    this.table.renderRows();
    // allow another click    
    this.doingThing = false;
  }

  // sum up all the gamesToGo values so we know 
  // if there are still games to allocate
  gamesToGoCount(norberts: { [key:string]: number}) {
    let values = Object.values(norberts);
    if(values.length === 0)
      return 0;
    return values.reduce((total, value) => total + value);
  }

  rotateGame(game) {
    let herbert = game.player1;
    for(let p = 1; p < game.playersPerGame; p++) {
      game[`player${p}`] = game[`player${p + 1}`];
    }
    game[`player${game.playersPerGame}`] = herbert;
  }

  shuffleGame(game) {
    let entries = Object.entries(game).filter((e) => /player\d+/.test(e[0]));
    entries = _.shuffle(entries);
    for(let p = 1; p <= game.playersPerGame; p++) {
      game[`player${p}`] = entries[p - 1][1];
    }
  }

// select the next players for the game
  nextPlayers(norberts: {[key: string]:number}): Array<string> {
    // create an array of arrays from object properties
    let entries = Object.entries(norberts);
    // add CHAOS
    // as we've included lodash we might as well
    // use their shuffle
    entries = _.shuffle(entries);
    console.log(entries);
    // sort by number of games to go for each player
    // the shuffled order will be kept just within
    // those that have the same number of games to go
    // using a stable sort to ensure we still keep the shuffled order
    // negating the value so we have descending order
    entries = _.sortBy(entries, [(o) => -o[1]]);
    console.log(entries);
    // take the players with most games to be allocated to
    let top = _.take(entries, this.playersPerGame);
    // just return the player names
    let p = [];
    for(let i = 0; i < this.playersPerGame; i++) {
      // unshift() to keep the order from shuffle
      p.unshift(top[i][0])
    }
    return p;
  }

  // chip stuff
  add(event: MatChipInputEvent): void {
    const input = event.input;
    const val = event.value;

    const values = val.split(/,|[\r\n]+/g);
    for(let value of values) {
      // Add our player
      if ((value || '').trim()) {
        this.players.push(value.trim());
      }
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(player: string): void {
    const index = this.players.indexOf(player);

    if (index >= 0) {
      this.players.splice(index, 1);
    }
  }

}


