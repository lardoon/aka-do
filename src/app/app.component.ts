import { Component, ElementRef, ViewChild } from "@angular/core";

import { MatTable } from "@angular/material/table";
import { CdkColumnDef } from "@angular/cdk/table";

import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatChipInputEvent } from "@angular/material/chips";

import { saveAs } from "file-saver";

import * as _ from "lodash";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from "@angular/material/autocomplete";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild("playerInput") playerInput: ElementRef<HTMLInputElement>;
  @ViewChild("auto") matAutocomplete: MatAutocomplete;

  STRING_COMPARER = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: "base" });

  gamesToPlayEach = 6;
  playersPerGame = 3;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  players = [];

  playerControl = new FormControl();
  filteredPlayers: Observable<string[]>;
  allPlayers: Array<string> = [];
  defaultPlayers: Array<string> = [
    "Aka",
    "Mazy",
    "Eth",
    "Biscuits",
    "Roderic",
    "Pancetta",
    "Iod",
    "Lardon",
    "Clef",
    "Blobka",
    "YogicFire",
    "Blubber",
    "Bos5k",
    "Eidolon",
    "Ruludos",
    "Ish",
    "Hauska",
    "Othrek",
    "Grythandril"
  ];

  playersLeftOver: Array<string> = [];

  displayedColumns = [];
  dataSource: Array<Object> = [];
  doingThing = false;

  highlight = "";
  stickyHighlight = false;

  loadPlayers(): Array<string> {
    let s = localStorage.getItem("players");
    if (!s) return this.defaultPlayers.slice();
    return JSON.parse(s);
  }

  savePlayers() {
    localStorage.setItem("players", JSON.stringify(this.allPlayers));
  }

  constructor() {
    this.allPlayers = this.loadPlayers().sort(this.STRING_COMPARER);
    this.filteredPlayers = this.playerControl.valueChanges.pipe(
      startWith(null),
      map((player: string | null) =>
        player ? this._filter(player) : this.allPlayers.slice()
      )
    );
  }

  resetInput() {
    this.playerInput.nativeElement.value = "";
    this.playerControl.setValue(null);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.players.push(event.option.viewValue);
    this.resetInput();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allPlayers.filter(
      player => player.toLowerCase().indexOf(filterValue) === 0
    );
  }

  // if clicked, stick the highlight to the clicked
  // player
  playerClick(player: string) {
    if (this.stickyHighlight) {
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
    if (!this.stickyHighlight) this.highlight = player;
  }

  // clear any hover data set in hovering()
  notHovering() {
    if (!this.stickyHighlight) this.highlight = "";
  }

  ngOnInit() {}

  exportToCsv() {
    let headers = this.displayedColumns.slice(1); // don't want nudge columns
    let dataSource = <Array<any>>this.table.dataSource;
    let data = dataSource.map(g => {
      // slice 1 to remove gamesToPlayEach property
      return Object.values(g)
        .slice(1)
        .join(",");
    });
    let result = new Blob([[headers.join(","), data.join("\n")].join("\n")]);

    saveAs(result, "export.csv");
  }

  doThisThing() {
    // simple flag to prevent running this function more than once
    // at any given time
    if (this.doingThing) return;
    this.doingThing = true;

    // we always want these first columns
    this.displayedColumns = ["nudge", "game", "player1", "player2"];

    // add other player columns as necessary
    for (let c = 3; c <= this.playersPerGame; c++) {
      this.displayedColumns.push(`player${c}`);
    }
    this.playersLeftOver = [];
    let norberts: { [key: string]: number } = {};
    this.dataSource = [];
    this.players.forEach((p, i) => {
      // construct a list with players and the number of games
      // to which they can be allocated
      norberts[p] = this.gamesToPlayEach;
    });
    let gameid = 1;

    // keep track of whether there are any games still to allocate
    // and we'll keep going until none left to allocate
    let gamesToGo = this.gamesToGoCount(norberts);
    while (gamesToGo !== 0) {
      // if we have some players left but not enough to make up a game
      // we'll report it and end the process
      if (Object.keys(norberts).length < this.playersPerGame) {
        // this might happen depending on no of players
        // and playersPerGame game values
        this.playersLeftOver = Object.keys(norberts);
        break;
      }

      // get the top players with the most games that still need to be allocated
      let herberts = this.nextPlayers(norberts);
      let game = {
        playersPerGame: this.playersPerGame, // keep hold of this value in case we need it later
        no: gameid
        // player1, player2 added here etc
      };
      gameid++;
      for (let p = 0; p < herberts.length; p++) {
        let herbert = herberts[p];
        game[`player${p + 1}`] = herbert;
        // one less game for this player to be allocated to
        norberts[herbert]--;
        // if we have no more games to allocate for this player
        // remove them from the list
        if (norberts[herbert] === 0) delete norberts[herbert];
      }

      // add this game to the table
      this.dataSource.push(game);

      gamesToGo = this.gamesToGoCount(norberts);
    }

    // redraw the table with the new data
    this.table.renderRows();
    // allow another click
    this.doingThing = false;
  }

  // sum up all the gamesToGo values so we know
  // if there are still games to allocate
  gamesToGoCount(norberts: { [key: string]: number }) {
    let values = Object.values(norberts);
    if (values.length === 0) return 0;
    return values.reduce((total, value) => total + value);
  }

  rotateGame(game) {
    let herbert = game.player1;
    for (let p = 1; p < game.playersPerGame; p++) {
      game[`player${p}`] = game[`player${p + 1}`];
    }
    game[`player${game.playersPerGame}`] = herbert;
  }

  shuffleGame(game) {
    let entries = Object.entries(game).filter(e => /player\d+/.test(e[0]));
    entries = _.shuffle(entries);
    for (let p = 1; p <= game.playersPerGame; p++) {
      game[`player${p}`] = entries[p - 1][1];
    }
  }

  // select the next players for the game
  nextPlayers(norberts: { [key: string]: number }): Array<string> {
    // create an array of arrays from object properties
    let entries = Object.entries(norberts);
    // add CHAOS
    // as we've included lodash we might as well
    // use their shuffle
    entries = _.shuffle(entries);

    // sort by number of games to go for each player
    // the shuffled order will be kept just within
    // those that have the same number of games to go
    // using a stable sort to ensure we still keep the shuffled order
    // negating the value so we have descending order
    entries = _.sortBy(entries, [o => -o[1]]);

    // take the players with most games to be allocated to
    let top = _.take(entries, this.playersPerGame);
    // just return the player names
    let p = [];
    for (let i = 0; i < this.playersPerGame; i++) {
      // unshift() to keep the order from shuffle
      p.unshift(top[i][0]);
    }
    return p;
  }

  isInAllPlayers(player: string): boolean {
    return (
      this.allPlayers.find(
        p => p.toLocaleLowerCase() === player.toLocaleLowerCase()
      ) !== undefined
    );
  }

  // chip stuff
  add(event: MatChipInputEvent): void {
    const val = event.value;

    const values = val.split(/,|[\r\n]+/g);
    let newPlayer = false;
    for (let value of values) {
      // Add our player
      if ((value || "").trim()) {
        this.players.push(value.trim());

        if (!this.isInAllPlayers(value)) {
          this.allPlayers.push(value);
          newPlayer = true;
        }
      }
    }

    if (newPlayer) {
      this.allPlayers = this.allPlayers.sort(this.STRING_COMPARER);
      this.savePlayers();
    }

    // Reset the input value in order to clear the autocomplete filter
    this.resetInput();
  }

  remove(player: string): void {
    const index = this.players.indexOf(player);

    if (index >= 0) {
      this.players.splice(index, 1);
    }
  }
}
