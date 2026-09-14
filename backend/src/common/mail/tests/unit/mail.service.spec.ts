import { Test } from '@nestjs/testing';
import { MailService } from '../../mail.service.js';

describe('MailService', () => {
  it('omite envío si Resend no está configurado', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;

    const module = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    const service = module.get(MailService);
    service.onModuleInit();

    const result = await service.send({
      to: 'a@b.com',
      subject: 'Test',
      html: '<p>hi</p>',
    });

    expect(result.skipped).toBe(true);
    expect(result.id).toBeNull();
  });
});
