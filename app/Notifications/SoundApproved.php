<?php

namespace App\Notifications;

use App\Models\Sound;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SoundApproved extends Notification implements ShouldQueue
{
    use Queueable;

    protected $sound;

    /**
     * Create a new notification instance.
     */
    public function __construct(Sound $sound)
    {
        $this->sound = $sound;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Votre son a été approuvé !')
            ->greeting('Bonjour ' . $notifiable->name . ' !')
            ->line('Excellente nouvelle ! Votre son "' . $this->sound->title . '" a été approuvé par notre équipe.')
            ->line('Il est maintenant visible sur la plateforme et les utilisateurs peuvent l\'écouter et l\'acheter.')
            ->action('Voir mon son', url('/sounds/' . $this->sound->slug))
            ->line('Vous pouvez maintenant gérer le prix et les paramètres de votre son depuis votre profil.')
            ->line('Merci de faire confiance à Réveil Artist !');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'sound_approved',
            'title' => 'Son approuvé !',
            'message' => 'Votre son "' . $this->sound->title . '" a été approuvé et est maintenant disponible sur la plateforme.',
            'sound_id' => $this->sound->id,
            'sound_title' => $this->sound->title,
            'sound_slug' => $this->sound->slug,
            'action_url' => url('/sounds/' . $this->sound->slug),
            'icon' => 'fas fa-check-circle',
            'color' => 'success'
        ];
    }
}
