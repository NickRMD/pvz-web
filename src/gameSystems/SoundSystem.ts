// enum InGameSongs {}
//
// export default class SoundSystem {
//   private _in_game_soundtrack?: HTMLAudioElement[];
//   private _current_song: number = 0;
//   private _audio_worker = new Worker("./SoundWorker.ts");
//   private _music_timestamp_paused = 0;
//   private _playing = false;
//
//   constructor() {}
//
//   public async load() {
//     const in_game_soundtrack = [];
//
//     in_game_soundtrack.push(new Audio("../../assets/ost_1.m4a"));
//     in_game_soundtrack.push(new Audio("../../assets/ost_menu.m4a"));
//
//     this._in_game_soundtrack = in_game_soundtrack;
//   }
//
//   public play_in_game_music() {
//     this._in_game_soundtrack![0].onended;
//   }
//
//   public toggle_pause() {}
//
//   public stop() {}
// }
