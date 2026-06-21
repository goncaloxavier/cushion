import {defineField, defineType} from 'sanity'

// Staff account for the private /painel backend. Lives only in the crm dataset.
// Passwords are never stored in plaintext — only a scrypt hash, written by the
// server/CLI. Created via `npm run staff:create`.
export const staffUser = defineType({
  name: 'staffUser',
  title: 'Conta de equipa',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'username',
      title: 'Utilizador',
      description: 'Nome de utilizador para iniciar sessão. Deve ser único (minúsculas).',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Função',
      type: 'string',
      initialValue: 'admin',
      options: {
        list: [
          {title: 'Administrador', value: 'admin'},
          {title: 'Equipa', value: 'staff'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Conta ativa',
      description: 'Desative para revogar o acesso sem apagar a conta.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'passwordHash',
      title: 'Hash da palavra-passe',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Criado em',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'lastLoginAt',
      title: 'Último início de sessão',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {title: 'name', username: 'username', role: 'role', active: 'active'},
    prepare({title, username, role, active}) {
      return {
        title: title || username || 'Conta',
        subtitle: `@${username || ''} · ${role || 'staff'}${active === false ? ' · inativa' : ''}`,
      }
    },
  },
})
