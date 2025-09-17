<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to control if a user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal pour les compétitions live
Broadcast::channel('competition.{competitionId}', function ($user, $competitionId) {
    // Vérifier si l'utilisateur peut accéder à cette compétition
    return true; // Pour l'instant, on autorise tout le monde
});

// Canal pour l'audio live des compétitions
Broadcast::channel('audio.competition.{competitionId}', function ($user, $competitionId) {
    // Vérifier si l'utilisateur peut accéder à l'audio de cette compétition
    return true; // Pour l'instant, on autorise tout le monde
}); 